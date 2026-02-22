# Email Logo Fix Instructions

## Problem
The welcome email is not sending, and the logo is not showing in emails.

## Solutions Implemented

### 1. Enhanced Error Logging
- Added detailed console logging to the signup flow in `/supabase/functions/server/index.tsx`
- You'll now see clear error messages if the welcome email fails
- Check the Supabase Edge Function logs for messages starting with `📧 SIGNUP` or `❌ SIGNUP`

### 2. Logo URL Update
The logo URL in emails has been updated in `/supabase/functions/server/mailersend.tsx`:
- **Previous URL**: `https://gravalist.com/wp-content/uploads/2024/08/Gravalist-logo-white.png`
- **New URL**: `https://hub.gravalist.com/gravalist-logo-white.png`

## Action Required: Upload Logo to Public Location

For emails to display the logo correctly, you need to host the logo at a publicly accessible URL. Here are your options:

### Option 1: Host on hub.gravalist.com (Recommended)
1. Upload the Gravalist logo (white version) to your hub.gravalist.com hosting
2. Make it accessible at: `https://hub.gravalist.com/gravalist-logo-white.png`
3. Ensure the file is publicly accessible (no authentication required)
4. Test the URL in a browser to confirm it loads

### Option 2: Use Gravalist.com
1. Upload the logo to your main gravalist.com website
2. Update the LOGO_URL in `/supabase/functions/server/mailersend.tsx` to point to the new location
3. Example: `https://gravalist.com/assets/gravalist-logo-white.png`

### Option 3: Use a CDN (Most Reliable)
1. Upload to a service like:
   - Cloudinary
   - ImgIX  
   - AWS S3 with public access
   - Supabase Storage with public bucket
2. Update the LOGO_URL with the CDN URL

### Option 4: Use Base64 Inline (Alternative)
If you can't host the logo externally, you can embed it as base64:

1. Convert your logo to base64
2. Update the LOGO_URL to use a data URL:
   ```typescript
   const LOGO_URL = 'data:image/png;base64,iVBORw0KGgoAAAANS...'
   ```

**Note**: Base64 images increase email size and may be blocked by some email clients.

## Testing the Email

After fixing the logo URL:

1. Test the signup flow with a new account
2. Check your email inbox
3. Look for the welcome email with subject: "Welcome to Gravalist - Select Your First Ride"
4. Verify the logo displays correctly

## Debugging Email Issues

If emails still don't send:

1. Check Supabase Edge Function logs:
   ```
   supabase functions logs server
   ```

2. Look for error messages with these patterns:
   - `❌ SIGNUP - Welcome email FAILED!`
   - `MAILERSEND - API error:`
   - `MAILERSEND_API_KEY`

3. Verify the MAILERSEND_API_KEY is set correctly in Supabase secrets

4. Test the MailerSend API key:
   - Log in to MailerSend dashboard
   - Check API key permissions
   - Verify sending domain is verified

## Current Logo in Emails

The email template includes:
- Logo image at the top
- Text "UNSUPPORTED ULTRACYCLING" below the logo
- Black background (#000000)
- Orange accent color (#FF6A00)

Make sure your uploaded logo:
- Is a white/light version (readable on black background)
- Has transparent background or black background
- Is at least 48px height for good email rendering
- Is optimized for web (small file size)
