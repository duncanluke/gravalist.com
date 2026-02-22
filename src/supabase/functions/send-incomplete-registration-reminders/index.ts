/**
 * Supabase Edge Function: Send Incomplete Registration Reminders
 * 
 * This function runs on a schedule (e.g., daily at 9am) to:
 * 1. Query for users with incomplete registrations
 * 2. Determine if they're eligible for a reminder email
 * 3. Send personalized reminder emails
 * 4. Log the activity for monitoring
 * 
 * Schedule: Configure in Supabase Dashboard > Edge Functions > Cron Jobs
 * Recommended: 0 9 * * * (Daily at 9am UTC)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for OPTIONS requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Starting incomplete registration reminder job...');
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get eligible registrations using our helper function
    const { data: eligibleRegistrations, error: queryError } = await supabase
      .rpc('get_reminder_eligible_registrations');

    if (queryError) {
      console.error('❌ Error querying eligible registrations:', queryError);
      throw queryError;
    }

    console.log(`📊 Found ${eligibleRegistrations?.length || 0} eligible registrations`);

    if (!eligibleRegistrations || eligibleRegistrations.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No eligible registrations found',
          sent: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Track results
    const results = {
      total: eligibleRegistrations.length,
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    // Process each eligible registration
    for (const registration of eligibleRegistrations) {
      try {
        console.log(`\n📧 Processing: ${registration.user_email} for ${registration.event_name}`);
        
        // Determine if we should send based on phase-specific timing
        const shouldSend = shouldSendReminderForPhase(
          registration.recommended_phase,
          new Date(registration.last_activity),
          new Date(registration.event_date)
        );

        if (!shouldSend.send) {
          console.log(`⏭️  Skipping: ${shouldSend.reason}`);
          results.skipped++;
          results.details.push({
            email: registration.user_email,
            event: registration.event_name,
            status: 'skipped',
            reason: shouldSend.reason
          });
          continue;
        }

        // Send the reminder email
        const emailResult = await sendReminderEmail(
          registration,
          registration.recommended_phase
        );

        if (emailResult.success) {
          console.log(`✅ Email sent successfully to ${registration.user_email}`);
          results.sent++;
          
          // Update reminder tracking in database
          await supabase.rpc('update_reminder_sent', {
            p_user_event_id: registration.user_event_id,
            p_phase: registration.recommended_phase
          });

          // Log the email send
          await logEmailReminder(supabase, registration, emailResult.messageId);

          results.details.push({
            email: registration.user_email,
            event: registration.event_name,
            status: 'sent',
            messageId: emailResult.messageId,
            phase: registration.recommended_phase
          });
        } else {
          console.error(`❌ Failed to send email to ${registration.user_email}:`, emailResult.error);
          results.failed++;
          results.details.push({
            email: registration.user_email,
            event: registration.event_name,
            status: 'failed',
            error: emailResult.error
          });
        }
      } catch (error) {
        console.error(`❌ Error processing ${registration.user_email}:`, error);
        results.failed++;
        results.details.push({
          email: registration.user_email,
          event: registration.event_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 Final Results:', {
      total: results.total,
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Fatal error in reminder job:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

/**
 * Determine if we should send a reminder based on phase-specific timing
 */
function shouldSendReminderForPhase(
  phase: string,
  lastActivity: Date,
  eventDate: Date
): { send: boolean; reason: string } {
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);
  const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

  switch (phase) {
    case 'register':
      // Send after 24 hours of inactivity (already checked in query)
      if (hoursSinceActivity >= 24) {
        return { send: true, reason: 'Registration incomplete for 24+ hours' };
      }
      return { send: false, reason: 'Not enough time elapsed since last activity' };
    
    case 'start_line':
      // Send 3 days before the event
      if (daysUntilEvent <= 3 && daysUntilEvent > 0) {
        return { send: true, reason: 'Event is within 3 days, start line not confirmed' };
      }
      if (daysUntilEvent <= 0) {
        return { send: false, reason: 'Event has already started/passed' };
      }
      return { send: false, reason: 'Event is more than 3 days away' };
    
    case 'end':
      // Send 7 days after the event (if they started)
      if (daysSinceEvent >= 7) {
        return { send: true, reason: 'Event finished 7+ days ago, completion not submitted' };
      }
      if (daysSinceEvent < 0) {
        return { send: false, reason: 'Event has not occurred yet' };
      }
      return { send: false, reason: 'Event finished less than 7 days ago' };
    
    default:
      return { send: false, reason: 'Unknown phase' };
  }
}

/**
 * Send reminder email via the Gravalist email API
 */
async function sendReminderEmail(
  registration: any,
  phase: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/make-server-91bdaa9f/send-incomplete-registration-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          eventId: registration.event_id,
          currentPhase: phase,
          // Override user email for service-to-service calls
          userEmail: registration.user_email
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return { 
        success: false, 
        error: `API error: ${response.status} - ${errorData}` 
      };
    }

    const data = await response.json();
    return { 
      success: data.success, 
      messageId: data.messageId,
      error: data.error 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Log email reminder to database for tracking and analytics
 */
async function logEmailReminder(
  supabase: any,
  registration: any,
  messageId?: string
): Promise<void> {
  try {
    const now = new Date();
    const lastActivity = new Date(registration.last_activity);
    const eventDate = new Date(registration.event_date);
    
    const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    const { error } = await supabase
      .from('email_reminder_log')
      .insert({
        user_id: registration.user_id,
        event_id: registration.event_id,
        user_event_id: registration.user_event_id,
        reminder_phase: registration.recommended_phase,
        recipient_email: registration.user_email,
        user_display_name: registration.display_name,
        event_name: registration.event_name,
        mailersend_message_id: messageId,
        current_step_id: registration.current_step_id,
        days_since_last_activity: daysSinceActivity.toFixed(2),
        days_until_event: daysUntilEvent.toFixed(2)
      });

    if (error) {
      console.error('⚠️  Error logging email reminder:', error);
    } else {
      console.log('📝 Email reminder logged to database');
    }
  } catch (error) {
    console.error('⚠️  Exception logging email reminder:', error);
  }
}
