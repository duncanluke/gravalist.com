# MailerSend Email Integration Setup

## Overview
Gravalist now uses **MailerSend** to send transactional emails including:
- 📧 Friend invitation emails
- 👋 Welcome emails for new users

## Setup Instructions

### 1. Create a MailerSend Account
1. Go to [MailerSend.com](https://www.mailersend.com/)
2. Sign up for a free account (allows 3,000 emails/month)

### 2. Verify Your Domain
1. In MailerSend dashboard, go to **Domains**
2. Add your domain: `gravalist.com`
3. Add the DNS records they provide to your domain registrar:
   - **TXT record** for domain verification
   - **CNAME records** for DKIM authentication
   - **MX record** if you want to receive bounces
4. Wait for verification (usually takes a few minutes)

### 3. Get Your API Key
1. Go to **Settings** → **API Tokens** in MailerSend dashboard
2. Click **Create Token**
3. Name it: `Gravalist Production`
4. Select scope: **Full access** (or at minimum: Email sending)
5. Copy the API key (starts with `mlsn.`)

### 4. Configure the Environment Variable
The `MAILERSEND_API_KEY` environment variable has already been created in your Supabase project.

Upload your API key:
1. The system will prompt you to enter your MailerSend API key
2. Paste the API key you copied from MailerSend
3. Save the secret

**Or manually set it in Supabase:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/sczqurjsiiaopszmuaof/settings/functions)
2. Navigate to **Edge Functions** → **Settings**
3. Add environment variable:
   - Key: `MAILERSEND_API_KEY`
   - Value: Your MailerSend API key

### 5. Update Sender Email (Optional)
The emails are currently sent from `noreply@gravalist.com`. To customize:

1. Open `/supabase/functions/server/mailersend.tsx`
2. Find the `from` field in both email functions:
   ```typescript
   from: {
     email: 'noreply@gravalist.com',  // Change this
     name: 'Gravalist'                 // And this
   }
   ```

### 6. Test the Integration

#### Test Invitation Email:
1. Sign in to Gravalist
2. Go to **Leaderboard**
3. Click **Invite Friend**
4. Enter an email address (use your own for testing)
5. Click **Send Invitation**
6. Check your inbox for the invitation email

#### Test Welcome Email:
1. Create a new account on Gravalist
2. Complete the signup process
3. Check your inbox for the welcome email

## Email Templates

### Invitation Email
- **Subject:** `[Inviter Name] invited you to join Gravalist`
- **Features:**
  - Personalized with inviter's name
  - Optional personal message
  - Orange CTA button matching brand
  - Dark theme (#000000 background)

### Welcome Email
- **Subject:** `Welcome to Gravalist - Your Adventure Begins`
- **Features:**
  - Personalized greeting
  - Feature highlights
  - "Breathe. You've got this." tagline
  - Link to explore rides

## Troubleshooting

### Emails Not Sending?
1. **Check API key:** Ensure it's correctly set in Supabase environment variables
2. **Domain verification:** Verify your domain is verified in MailerSend
3. **Check logs:** View Edge Function logs in Supabase dashboard
4. **Rate limits:** Free tier allows 3,000 emails/month

### Email Goes to Spam?
1. Complete domain verification with all DNS records
2. Set up SPF, DKIM, and DMARC records
3. Warm up your domain by sending gradually increasing volumes
4. Monitor your sender reputation in MailerSend dashboard

### API Errors?
Common error codes:
- **401 Unauthorized:** Invalid API key
- **403 Forbidden:** Domain not verified
- **422 Unprocessable:** Invalid email format or missing required fields
- **429 Too Many Requests:** Rate limit exceeded

## Monitoring

### View Email Activity:
1. Go to MailerSend dashboard → **Activity**
2. See real-time email delivery status
3. Monitor opens, clicks, bounces, and complaints

### Analytics:
- Track email performance
- Monitor delivery rates
- View engagement metrics

## Customization

### Edit Email HTML Templates:
Email templates are in `/supabase/functions/server/mailersend.tsx`:
- `sendInvitationEmail()` - Friend invitations
- `sendWelcomeEmail()` - New user welcome

### Email Design Guidelines:
- ✅ Black background (#000000) - brand consistency
- ✅ Orange CTA (#FF6A00) - brand primary color
- ✅ Inter font family - brand typography
- ✅ Mobile-responsive design
- ✅ Plain text version included

## Cost Estimates

### MailerSend Pricing:
- **Free:** 3,000 emails/month
- **Starter:** $25/month - 50,000 emails
- **Professional:** $80/month - 100,000 emails

### Expected Usage:
- **Welcome emails:** 1 per new user signup
- **Invitation emails:** 1 per friend invitation
- **Estimated:** ~100-500 emails/month initially

## Support

- **MailerSend Docs:** https://developers.mailersend.com/
- **API Reference:** https://developers.mailersend.com/api/v1/email.html
- **Support:** support@mailersend.com
