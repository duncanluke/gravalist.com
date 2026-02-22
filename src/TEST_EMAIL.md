# Email Testing Guide

## Simple Test Steps

### 1. Check MailerSend API Key
```bash
# In Supabase Dashboard > Settings > Edge Functions > Secrets
# Verify MAILERSEND_API_KEY is set
```

### 2. Test Direct Email Endpoint

Open browser console and run:

```javascript
// Get your access token
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

// Replace with actual event ID from your database
const eventId = 'YOUR_EVENT_ID_HERE'; 

// Call the simple email endpoint
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-server-91bdaa9f/send-ride-email/${eventId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
console.log('Email result:', result);
```

### 3. Check Supabase Logs

```bash
supabase functions logs server --follow
```

Look for:
- `📧 SIMPLE EMAIL TRIGGER` - Email endpoint called
- `📨 Sending to:` - Email being sent
- `✅ EMAIL SENT!` - Success
- `❌ EMAIL FAILED!` - Failure with error

### 4. Automatic Trigger (Step 1)

The email now triggers automatically when:
1. User clicks into a ride
2. Soft registration succeeds at Step 1
3. Frontend calls the email endpoint

Check console for:
```
📧 Triggering registration email for: [Ride Name]
✅ Email sent!
```

## Expected Flow

```
User clicks ride
  ↓
Soft registration (Step 1)
  ↓
✅ Connected to ride
  ↓
📧 Email endpoint called (fire & forget)
  ↓
Email sent to user
```

## Troubleshooting

### Email not sending?

1. **Check API key**
   - Go to Supabase > Edge Functions > Secrets
   - Verify MAILERSEND_API_KEY exists
   - Test with: `console.log(Deno.env.get('MAILERSEND_API_KEY'))`

2. **Check logs**
   ```bash
   supabase functions logs server --follow
   ```
   
3. **Check event exists**
   - Event must be in database
   - Event must have `id`, `name`, `start_date`

4. **Check user exists**
   - User must be authenticated
   - User must exist in `users` table

5. **Check MailerSend account**
   - Login to MailerSend dashboard
   - Check if domain is verified
   - Check if API key is active
   - Check sending limits

### Common Errors

**Error: "Event not found"**
- Event ID is wrong
- Event doesn't exist in database
- Check: `SELECT id, name FROM events;`

**Error: "User not found"**
- User email doesn't match database
- Check: `SELECT email FROM users WHERE email = 'YOUR_EMAIL';`

**Error: "Failed to send email: 401"**
- API key is invalid or expired
- Get new key from MailerSend dashboard

**Error: "Failed to send email: 403"**
- Domain not verified in MailerSend
- Or domain sending paused/blocked

**Email goes to spam**
- Domain needs SPF/DKIM configuration
- Ask MailerSend support to verify setup

## Manual Email Send (Emergency Backup)

If automated emails fail, use this SQL to get user/event data:

```sql
-- Get all registrations needing emails
SELECT 
  u.email,
  u.display_name,
  e.id as event_id,
  e.name as event_name,
  e.start_date,
  u.is_premium_subscriber
FROM user_events ue
JOIN users u ON u.id = ue.user_id
JOIN events e ON e.id = ue.event_id
WHERE ue.registration_status = 'in_progress'
  AND ue.created_at > NOW() - INTERVAL '1 day';
```

Then send emails manually via MailerSend dashboard.

## Verification Checklist

Before going live:

- [ ] MailerSend API key is set in Supabase secrets
- [ ] Domain (gravalist.com) is verified in MailerSend
- [ ] SPF and DKIM records are configured
- [ ] Logo URL is accessible (not broken)
- [ ] Test email sends successfully
- [ ] Email arrives in inbox (not spam)
- [ ] All dynamic data renders correctly (name, ride, date)
- [ ] Subscriber vs non-subscriber logic works
- [ ] CTA button links to correct URL
- [ ] HubSpot BCC tracking works
