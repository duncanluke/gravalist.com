// ============================================================================
// INTEGRATION EXAMPLE: How to Add Email Reminders to Your Registration Flow
// ============================================================================

// Example 1: Send email when user navigates away from incomplete registration
// Location: /components/OnboardingRouter.tsx or wherever you handle navigation

import { sendIncompleteRegistrationEmail } from './utils/incompleteRegistrationEmail';
import { useAuth } from './hooks/useAuth';
import { useEffect } from 'react';

export function OnboardingRouter({ state, onViewModeChange }: any) {
  const { user } = useAuth();
  
  // Track when user leaves onboarding
  useEffect(() => {
    // When component unmounts (user navigates away)
    return () => {
      handleUserExitsIncomplete();
    };
  }, []);
  
  const handleUserExitsIncomplete = async () => {
    // Only send if:
    // 1. User is authenticated
    // 2. They're in an event-specific flow
    // 3. They haven't completed registration
    if (!user || !state.isInSpecificEventFlow || state.agreementsCompleted) {
      return;
    }
    
    // Get current event and phase
    const currentEventId = getCurrentEventId(state.currentEvent);
    const currentPhase = determinePhase(state.currentStepId);
    
    if (!currentEventId || !currentPhase) {
      return;
    }
    
    // Get access token
    const { createClient } = await import('./utils/supabase/client');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || '',
      import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      // Send the reminder email
      const result = await sendIncompleteRegistrationEmail(
        currentEventId,
        currentPhase,
        session.access_token
      );
      
      if (result.success) {
        console.log('✅ Reminder email sent for incomplete registration');
      } else {
        console.error('❌ Failed to send reminder email:', result.error);
      }
    }
  };
  
  // Helper to determine phase from step ID
  const determinePhase = (stepId: number): 'register' | 'start_line' | 'end' | null => {
    if (stepId >= 0 && stepId <= 9) return 'register';
    if (stepId >= 10 && stepId <= 14) return 'start_line';
    if (stepId >= 15 && stepId <= 17) return 'end';
    return null;
  };
  
  // ... rest of your component
}

// ============================================================================
// Example 2: Add a manual "Send Reminder" button to event detail pages
// Location: /components/DynamicEventPage.tsx or event-specific pages
// ============================================================================

import { SendReminderEmailButton } from './components/SendReminderEmailButton';
import { useEvents } from './hooks/useEvents';
import { useAuth } from './hooks/useAuth';

export function DynamicEventPage({ eventSlug }: any) {
  const { events } = useEvents();
  const { isAuthenticated, user } = useAuth();
  const event = events.find(e => e.slug === eventSlug);
  
  // Get user's current progress for this event
  const userProgress = getUserProgressForEvent(event?.id);
  
  return (
    <div>
      <h1>{event?.name}</h1>
      
      {/* Show "Send Reminder" button if user has incomplete registration */}
      {isAuthenticated && userProgress && !userProgress.isCompleted && (
        <div className="mt-4">
          <SendReminderEmailButton 
            eventId={event.id}
            eventName={event.name}
            currentPhase={userProgress.phase}
            className="mb-4"
          />
          <p className="text-sm text-muted-foreground">
            Test the reminder email for this incomplete registration
          </p>
        </div>
      )}
      
      {/* ... rest of your event page */}
    </div>
  );
}

// ============================================================================
// Example 3: Scheduled job to send reminders (Backend - Supabase Edge Function)
// Location: Create new file /supabase/functions/send-reminders/index.ts
// ============================================================================

/**
 * This edge function should be triggered by a cron job (e.g., daily at 9am)
 * It finds all users with incomplete registrations and sends reminder emails
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Query for incomplete registrations
    // Adjust this query based on your actual schema
    const { data: incompleteRegistrations, error } = await supabase
      .from('user_registrations')
      .select(`
        id,
        event_id,
        user_id,
        current_step,
        updated_at,
        users (
          email,
          display_name
        ),
        events (
          id,
          name,
          event_date,
          location,
          slug
        )
      `)
      .eq('is_completed', false)
      .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours ago

    if (error) throw error

    console.log(`Found ${incompleteRegistrations?.length || 0} incomplete registrations`)

    // Send emails for eligible registrations
    for (const registration of incompleteRegistrations || []) {
      // Determine phase from current_step
      let phase: 'register' | 'start_line' | 'end' = 'register'
      if (registration.current_step >= 15) phase = 'end'
      else if (registration.current_step >= 10) phase = 'start_line'

      // Check if we should send based on timing
      const lastActivity = new Date(registration.updated_at)
      const eventDate = new Date(registration.events.event_date)
      
      // Import the logic or implement it here
      const shouldSend = shouldSendReminder(phase, lastActivity, eventDate)
      
      if (!shouldSend) {
        console.log(`Skipping ${registration.users.email} - not ready for reminder`)
        continue
      }

      // Call the email API endpoint
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
            currentPhase: phase
          })
        }
      )

      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ Sent reminder to ${registration.users.email} for ${registration.events.name}`)
        
        // Mark that we sent the email (add this column to your schema)
        await supabase
          .from('user_registrations')
          .update({ 
            last_reminder_sent: new Date().toISOString(),
            reminder_count: supabase.raw('reminder_count + 1')
          })
          .eq('id', registration.id)
      } else {
        console.error(`❌ Failed to send to ${registration.users.email}:`, result.error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: incompleteRegistrations?.length || 0 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-reminders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function shouldSendReminder(
  phase: 'register' | 'start_line' | 'end',
  lastActivity: Date,
  eventDate: Date
): boolean {
  const now = new Date()
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
  const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)

  switch (phase) {
    case 'register':
      return hoursSinceActivity >= 24
    case 'start_line':
      return daysUntilEvent <= 3 && daysUntilEvent > 0
    case 'end':
      return daysSinceEvent >= 7
    default:
      return false
  }
}

// ============================================================================
// Example 4: Add to your database schema (optional)
// ============================================================================

/*
Add these columns to your user_registrations table to track email sends:

ALTER TABLE user_registrations 
ADD COLUMN last_reminder_sent TIMESTAMP,
ADD COLUMN reminder_count INTEGER DEFAULT 0;

This helps you:
1. Avoid sending duplicate reminders
2. Track how many reminders each user received
3. Analyze effectiveness of reminder emails
*/

// ============================================================================
// Quick Start for Testing
// ============================================================================

/*
1. In your app, add the SendReminderEmailButton to any page:

   import { SendReminderEmailButton } from './components/SendReminderEmailButton';
   
   <SendReminderEmailButton 
     eventId="your-event-uuid"
     eventName="Clarens 500"
     currentPhase="register"
   />

2. Click the button to send a test email to yourself

3. Check your inbox to see the beautifully formatted reminder

4. Click the "Complete Registration" button in the email to verify the link works

5. Once satisfied, integrate using Examples 1-3 above for automatic sending
*/
