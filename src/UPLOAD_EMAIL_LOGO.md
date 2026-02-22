# Upload Email Logo to Supabase Storage

## Quick Fix Guide

### Problem Summary
1. **Welcome emails not sending**: Enhanced logging added - check Supabase logs for detailed error messages
2. **Logo not showing**: Logo URL needs to point to a publicly accessible image

### Solution: Upload Logo to Supabase Storage

#### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Look for the bucket: `make-91bdaa9f-public-assets`

#### Step 2: Upload the Logo
1. Click on the `make-91bdaa9f-public-assets` bucket
2. Click **Upload File**
3. Upload your Gravalist logo (white version on transparent or black background)
4. Name it: `gravalist-logo-white.png`
5. Make sure it's at least 48px in height

#### Step 3: Get the Public URL
1. After uploading, click on the file in the bucket
2. Click **Get Public URL** or **Copy URL**
3. The URL should look like:
   ```
   https://[your-project-id].supabase.co/storage/v1/object/public/make-91bdaa9f-public-assets/gravalist-logo-white.png
   ```

#### Step 4: Update the Logo URL in Code
1. Open `/supabase/functions/server/mailersend.tsx`
2. Find the line: `const LOGO_URL = '...'`
3. Replace with your Supabase Storage URL:
   ```typescript
   const LOGO_URL = 'https://[your-project-id].supabase.co/storage/v1/object/public/make-91bdaa9f-public-assets/gravalist-logo-white.png';
   ```

#### Step 5: Verify the Logo
1. Copy the URL and paste it in a browser
2. The logo should load without any authentication
3. If you see an error, the bucket might not be public

#### Step 6: Make Bucket Public (if needed)
If the logo URL doesn't work:
1. Go to Supabase Dashboard → Storage
2. Click on `make-91bdaa9f-public-assets`
3. Click **Settings** (gear icon)
4. Enable **Public bucket**
5. Save changes

## Alternative: Use Existing WordPress Logo

The code is currently set to fallback to:
```
https://gravalist.com/wp-content/uploads/2024/08/Gravalist-logo-white.png
```

**To test if this works:**
1. Open that URL in a browser
2. If the logo loads, emails should display it
3. If it doesn't load, you need to upload to Supabase Storage or another public location

## Testing Email After Fix

1. Sign up with a new test account
2. Check the email inbox for "Welcome to Gravalist - Select Your First Ride"
3. Verify the logo appears at the top of the email
4. If logo still doesn't show, check browser console for the image URL

## Logo Specifications

For best email rendering, your logo should:
- **Format**: PNG with transparency (or JPG with black background)
- **Color**: White or light-colored (readable on black background)
- **Size**: Minimum 48px height, maximum 200px height recommended
- **File size**: Under 100KB for fast email loading
- **Aspect ratio**: Landscape orientation preferred

## Debugging Email Send Issues

If emails still aren't sending after logo fix:

### Check Supabase Logs
```bash
# View Edge Function logs
supabase functions logs server --follow
```

Look for these log patterns:
- `📧 SIGNUP - Attempting to send welcome email...`
- `✅ SIGNUP - Welcome email sent successfully!`
- `❌ SIGNUP - Welcome email FAILED!`

### Common Issues

1. **MailerSend API Key Missing**
   - Error: `Email service not configured`
   - Fix: Ensure MAILERSEND_API_KEY is set in Supabase secrets

2. **MailerSend API Error**
   - Error: `Failed to send email: 401 Unauthorized`
   - Fix: Verify API key is valid in MailerSend dashboard

3. **Email Domain Not Verified**
   - Error: `Domain not verified`
   - Fix: Verify noreply@gravalist.com domain in MailerSend

4. **Rate Limiting**
   - Error: `Too many requests`
   - Fix: Check MailerSend account limits

## Support

If you need help:
1. Share the Supabase Edge Function logs
2. Include any error messages from the browser console
3. Confirm the logo URL loads in a browser
4. Check MailerSend dashboard for delivery status
