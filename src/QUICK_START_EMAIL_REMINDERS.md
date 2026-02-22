# Quick Start: Email Reminders for Incomplete Registrations

## What This Does

When a user starts registering for a ride but doesn't complete it, you can send them a personalized reminder email that:
- Shows them exactly where they left off
- Lists the specific steps they need to complete
- Reminds them of the points they'll earn
- Provides a direct link to continue their registration

## How to Use It

### Method 1: Add a "Send Reminder" Button (Testing/Admin)

Add this to any component where you want to manually trigger a reminder:

```tsx
import { SendReminderEmailButton } from './components/SendReminderEmailButton';

function EventDetailsPage() {
  return (
    <div>
      <h2>Clarens 500</h2>
      
      {/* Send reminder email button */}
      <SendReminderEmailButton 
        eventId="your-event-uuid"
        eventName="Clarens 500"
        currentPhase="register"  // or "start_line" or "end"
      />
    </div>
  );
}
```

### Method 2: Trigger Programmatically

Call the function when a user navigates away from incomplete registration:

```tsx
import { sendIncompleteRegistrationEmail } from './utils/incompleteRegistrationEmail';
import { useAuth } from './hooks/useAuth';

function OnboardingFlow() {
  const { user } = useAuth();
  
  const handleUserExitsIncomplete = async () => {
    // Get access token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token && eventId) {
      // Send reminder email
      await sendIncompleteRegistrationEmail(
        eventId,
        'register',  // current phase
        session.access_token
      );
    }
  };
  
  // Trigger when user clicks "Exit" or navigates away
  // ...
}
```

### Method 3: Automatic Trigger After 24 Hours

You can check if enough time has passed and trigger the email:

```tsx
import { shouldSendIncompleteReminder } from './utils/incompleteRegistrationEmail';

// In your backend scheduled job or frontend check
const lastActivity = new Date(user.lastRegistrationActivity);
const eventDate = new Date(event.event_date);

if (shouldSendIncompleteReminder('register', lastActivity, eventDate)) {
  // Send the reminder
  await sendIncompleteRegistrationEmail(eventId, 'register', accessToken);
}
```

## Email Preview

Here's what the user will receive:

```
Subject: Clarens 500 - Complete Your Registration Phase

[Gravalist Logo]

⏰ Action Required

Clarens 500
📅 25 December 2024
📍 Clarens, South Africa

Hey John, breathe. You've got this.

You started registering for Clarens 500, but you haven't finished yet. 
We wanted to remind you what's waiting and help you complete your journey.

REGISTRATION PHASE
Complete your registration and get ready for the ride

WHAT'S NEXT:
1. Set Your Username
   Choose how you'll appear on the leaderboard

2. Emergency Contact
   Add your emergency contact information

3. Review Details
   Confirm your registration details

⭐ Earn 100 points for completing registration

THE COMPLETE JOURNEY:
1. Register Phase ← You are here
2. Start Line
3. End

[Complete Registration Button]
```

## Testing

1. **Sign in** to hub.gravalist.com
2. **Start registration** for any ride
3. **Don't complete it** - navigate away
4. **Manually trigger** the email using the button
5. **Check your email** inbox

## The Three Phases

- **Register**: Send 24 hours after they start but don't finish registration
- **Start Line**: Send 3 days before the ride date if they haven't checked in
- **End**: Send 7 days after the ride if they started but didn't submit completion

## Next Steps

To fully automate:
1. Set up a Supabase cron job
2. Query for incomplete registrations
3. Call the email endpoint for eligible users
4. Track sent emails to avoid duplicates

See `INCOMPLETE_REGISTRATION_EMAIL.md` for full technical documentation.
