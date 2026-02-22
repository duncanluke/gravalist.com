# Incomplete Registration Email System

## Overview

This system sends personalized reminder emails to users who start registration for a ride but don't complete it. The emails are context-aware and show different content based on which phase the user is in.

## Features

### 📧 Email Content

The email includes:
- **Personalized greeting** with the user's display name
- **Ride details** (name, date, location)
- **Current phase indicator** highlighting where the user left off
- **Next steps** specific to their current phase with detailed descriptions
- **Points reminder** showing what they'll earn for completing
- **Complete 3-phase overview** with visual indication of current position
- **CTA button** linking back to the ride page to continue
- **Brand-aligned design** using Gravalist colors (#FF6A00 orange, black background)

### 📍 Three Phases

#### 1. **Register Phase**
- **When**: User starts registration but doesn't finish
- **Next Steps**:
  - Set Your Username
  - Emergency Contact
  - Review Details
- **Earn**: 100 points for completing registration

#### 2. **Start Line Phase**
- **When**: User registered but hasn't checked in on ride day
- **Next Steps**:
  - Arrive at Start
  - Take Starting Photo
  - Confirm Start Time
- **Earn**: 200 points for starting your ride

#### 3. **End Phase**
- **When**: User started the ride but hasn't submitted completion
- **Next Steps**:
  - Enter Finish Time
  - Upload Tracking Data
  - Proof of Completion
- **Earn**: Major completion points and leaderboard status

## Technical Implementation

### Backend Endpoint

**Endpoint**: `POST /make-server-91bdaa9f/send-incomplete-registration-email`

**Authentication**: Requires bearer token (user must be authenticated)

**Request Body**:
```json
{
  "eventId": "uuid-of-event",
  "currentPhase": "register" | "start_line" | "end"
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "mailersend-message-id"
}
```

### Frontend Usage

#### Option 1: Manual Trigger (for testing/admin)

```tsx
import { SendReminderEmailButton } from './components/SendReminderEmailButton';

function MyComponent() {
  return (
    <SendReminderEmailButton 
      eventId="event-uuid"
      eventName="Clarens 500"
      currentPhase="register"
    />
  );
}
```

#### Option 2: Programmatic

```tsx
import { sendIncompleteRegistrationEmail } from './utils/incompleteRegistrationEmail';

async function sendReminder(eventId: string, phase: 'register' | 'start_line' | 'end') {
  // Get user's access token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    const result = await sendIncompleteRegistrationEmail(
      eventId,
      phase,
      session.access_token
    );
    
    if (result.success) {
      console.log('Email sent!');
    }
  }
}
```

### When to Send Reminders

The helper function `shouldSendIncompleteReminder()` provides logic for when to send:

```typescript
import { shouldSendIncompleteReminder } from './utils/incompleteRegistrationEmail';

const lastActivity = new Date('2024-12-18');
const eventDate = new Date('2024-12-25');

// Returns true if:
// - Register phase: 24 hours of inactivity
// - Start Line phase: 3 days before event
// - End phase: 7 days after event
const should Send = shouldSendIncompleteReminder('register', lastActivity, eventDate);
```

## Automated Scheduling (Future Enhancement)

To fully automate this, you could:

1. **Create a Supabase Edge Function** that runs on a schedule (cron job)
2. **Query for incomplete registrations**:
   ```sql
   SELECT 
     ur.event_id,
     ur.user_id,
     u.email,
     u.display_name,
     e.name,
     e.event_date,
     e.location,
     ur.current_step,
     ur.updated_at
   FROM user_registrations ur
   JOIN users u ON ur.user_id = u.id
   JOIN events e ON ur.event_id = e.id
   WHERE ur.is_completed = false
   AND ur.updated_at < NOW() - INTERVAL '24 hours'
   ```
3. **Determine phase** from current_step
4. **Call the email endpoint** for each user

## Email Service

Uses **MailerSend** API with:
- From: `noreply@gravalist.com`
- BCC: `139710685@bcc.eu1.hubspot.com` (HubSpot tracking)
- HTML and plain text versions
- Mobile-responsive design

## Testing

To test the email:

1. Sign in to the app
2. Start registration for any ride but don't complete it
3. Use the `SendReminderEmailButton` component with your event details
4. Check your email inbox

## Environment Variables Required

- `MAILERSEND_API_KEY` - Already configured in your environment

## Files

- `/supabase/functions/server/incomplete-registration-email.tsx` - Email template and sender
- `/supabase/functions/server/index.tsx` - API endpoint
- `/utils/incompleteRegistrationEmail.ts` - Frontend helper functions
- `/components/SendReminderEmailButton.tsx` - React component for manual sending

## Design Alignment

The email follows Gravalist's brand guidelines:
- **Colors**: Black background (#000000), Orange (#FF6A00)
- **Typography**: Inter font family
- **Tone**: Calm, clear, community-focused
- **Messaging**: "Breathe. You've got this." and "My tracking, my responsibility."
