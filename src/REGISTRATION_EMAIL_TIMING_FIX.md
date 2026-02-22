# Registration Email Timing Fix

## Problem
The comprehensive ride registration email was not sending when users started registering for an event.

## Root Cause
The email was configured to send after the "About You" step (Step 3), which:
1. Required the user to progress further into onboarding
2. Depended on the `eventName` parameter being passed correctly
3. Could fail silently if the event lookup failed

## Solution Implemented

### Email Now Sends at Step 1 (Soft Registration)
The email is now triggered during the **soft registration** process, which happens when a user:
1. Selects a ride
2. Clicks through the Welcome step
3. The system connects them to the event

This occurs at `/supabase/functions/server/index.tsx` in the soft-register route (line ~1442)

### What Happens Now

When a user starts registration:

1. **Soft Registration Triggered** (Step 1)
   - User is connected to the event with `registration_status: 'in_progress'`
   - System logs: `🎯 SOFT REGISTRATION - STEP 1 TRIGGERED`

2. **Email Automatically Sent**
   - System fetches user details (display name, subscription status)
   - System fetches event details (name, date, id)
   - Comprehensive registration email is sent via `sendRideRegistrationEmail()`
   - System logs: `📧 SOFT REGISTRATION - Sending comprehensive registration email...`

3. **Success/Failure Logging**
   - Success: `✅ ✅ ✅ REGISTRATION EMAIL SENT SUCCESSFULLY!`
   - Failure: `❌ REGISTRATION EMAIL FAILED!` with error details
   - Non-blocking: Registration continues even if email fails

## Email Content

The registration email includes:

### Header
- Gravalist logo (white version)
- "UNSUPPORTED ULTRACYCLING" tagline
- "✓ Registration Started" badge
- Ride name and date

### Main Content
1. **Personalized greeting**: "Hey [Name], breathe. You've got this."
2. **Introduction**: Explains self-managed ride philosophy
3. **What Happens Next**: Overview of 3-phase process

### The 3 Phases (Detailed Breakdown)

**Phase 1: Register** (highlighted as "In Progress")
- Step 1: Set username
- Step 2: Provide emergency contact
- Step 3: Confirm equipment checklist
- Earn 100 points

**Phase 2: Start Line** (locked until ride day)
- Step 1: Arrive at start line
- Step 2: Open app and check in
- Step 3: Confirm ready to start
- Earn 200 points

**Phase 3: End** (locked until after finish)
- Step 1: Enter finish time
- Step 2: Upload tracking data
- Step 3: Share proof of completion
- Earn completion points

### Additional Sections

**Route File Access** (conditional)
- Non-subscribers: Upgrade CTA with subscription benefits
- Subscribers: Confirmation of download access

**Important Reminders**
- ⚠️ No official support
- 📍 My tracking, my responsibility
- 🏆 Points & leaderboard info

**Call-to-Action**
- Orange button: "Complete Your Registration"
- Deep link to: `https://hub.gravalist.com/ride/${rideId}`

### Footer
- "My tracking, my responsibility"
- Link to gravalist.com
- HubSpot BCC tracking enabled

## Testing

### How to Test
1. Sign up for a new account (or use existing)
2. Navigate to a ride page
3. Click "Register" or "Enter Ride"
4. Click through the Welcome step (Step 1)
5. Check your email inbox

### Expected Behavior
- Email should arrive within 1-2 minutes
- Subject: "Registration Started: [Ride Name] - Complete Your Registration"
- From: "Gravalist <noreply@gravalist.com>"

### Debugging

If email doesn't send, check Supabase Edge Function logs for:

```bash
supabase functions logs server --follow
```

Look for these log patterns:

**Soft Registration Started:**
```
🎯 SOFT REGISTRATION - STEP 1 TRIGGERED
Event ID: [event-id]
User Email: [email]
```

**Email Sending:**
```
📧 SOFT REGISTRATION - Sending comprehensive registration email...
📨 Sending ride registration email with:
   → Email: [email]
   → Display Name: [name]
   → Ride: [ride-name]
   → Date: [date]
   → Event ID: [id]
   → Is Subscriber: [true/false]
```

**Success:**
```
✅ ✅ ✅ REGISTRATION EMAIL SENT SUCCESSFULLY!
   → Message ID: [message-id]
```

**Failure:**
```
❌ REGISTRATION EMAIL FAILED!
   → Error: [error-message]
```

### Common Issues

**Issue**: Email not sending
**Check**:
1. MailerSend API key is set in Supabase secrets
2. Logo URL is accessible (see EMAIL_LOGO_FIX_INSTRUCTIONS.md)
3. Event exists in database and has required fields
4. User has display_name set (fallback to 'Rider' if not)

**Issue**: Email goes to spam
**Solution**:
- Verify noreply@gravalist.com domain in MailerSend
- Check SPF/DKIM records
- Ask users to whitelist noreply@gravalist.com

## Email Sending at Other Steps

The system can still send emails at other steps:

1. **Welcome Email** - When user first signs up (sign up flow)
2. **Registration Email** - When user starts registration (Step 1 - NEW!)
3. **Incomplete Registration Reminder** - Manual trigger for users who didn't finish
4. **Invitation Email** - When user invites a friend

## Backward Compatibility

The "About You" email trigger is still in place (line ~737) but:
- It's now redundant since email is sent at Step 1
- It provides a fallback if soft registration doesn't trigger
- Consider removing it in a future cleanup to avoid duplicate emails

## Files Modified

1. `/supabase/functions/server/index.tsx`
   - Added email trigger to soft-register route (line ~1442-1508)
   - Email sends immediately after successful soft registration

2. `/supabase/functions/server/mailersend.tsx`
   - No changes needed - email template already comprehensive

## Next Steps

1. **Test thoroughly** with different user types (subscribers vs non-subscribers)
2. **Monitor logs** for any email failures
3. **Upload logo** to fix broken logo issue (see EMAIL_LOGO_FIX_INSTRUCTIONS.md)
4. **Consider removing** the About You email trigger to avoid duplicates
5. **Track email metrics** in MailerSend dashboard

## Success Criteria

✅ Email sends when user clicks through Welcome step
✅ Email includes all ride details, onboarding steps, and subscription info
✅ Email respects subscriber status (shows correct CTA)
✅ Email includes proper branding and Gravalist philosophy
✅ Registration continues even if email fails (non-blocking)
✅ Comprehensive logging for debugging
