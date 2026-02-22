import { projectId, publicAnonKey } from './supabase/info';

/**
 * Send an incomplete registration reminder email to a user
 * @param eventId - The ID of the event
 * @param currentPhase - The current phase: 'register', 'start_line', or 'end'
 * @param accessToken - User's access token for authentication
 * @returns Promise with success status
 */
export async function sendIncompleteRegistrationEmail(
  eventId: string,
  currentPhase: 'register' | 'start_line' | 'end',
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Triggering incomplete registration email:', {
      eventId,
      currentPhase
    });

    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-91bdaa9f/send-incomplete-registration-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          eventId,
          currentPhase
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to send incomplete registration email:', data);
      return {
        success: false,
        error: data.error || 'Failed to send email'
      };
    }

    console.log('✅ Incomplete registration email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending incomplete registration email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if user should receive an incomplete registration reminder
 * This should be called when a user leaves the registration flow incomplete
 * 
 * Rules:
 * - Send after 24 hours of inactivity in registration phase
 * - Send 3 days before ride date for start_line phase
 * - Send 7 days after ride date for end phase (if they started)
 */
export function shouldSendIncompleteReminder(
  currentPhase: 'register' | 'start_line' | 'end',
  lastActivityDate: Date,
  eventDate: Date
): boolean {
  const now = new Date();
  const hoursSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
  const daysUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceEvent = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

  switch (currentPhase) {
    case 'register':
      // Send after 24 hours of inactivity
      return hoursSinceActivity >= 24;
    
    case 'start_line':
      // Send 3 days before the event
      return daysUntilEvent <= 3 && daysUntilEvent > 0;
    
    case 'end':
      // Send 7 days after the event (assuming they started)
      return daysSinceEvent >= 7;
    
    default:
      return false;
  }
}
