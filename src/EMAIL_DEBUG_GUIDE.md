# 📧 Email Debugging Guide - Ride Registration Email

## Email Trigger: Step 3/18 (About You)

The ride registration email is now triggered when users complete the "About You" step and click "Continue".

## 🔒 Security: Always Using Auth Email

**IMPORTANT:** The email is sent to `user.email` from the JWT authentication token, NOT from the database. This ensures:
- ✅ We always send to the authenticated user's email
- ✅ Email can't be spoofed via database manipulation
- ✅ Source of truth is the auth system, not the database

---

## ✅ How to Test

1. **Start a new ride registration:**
   - Go to the homepage
   - Click "Explore Community Rides"
   - Select a ride (e.g., "The 500")
   - Click "Register"

2. **Complete steps 1-2:**
   - Step 1: Enter email and create password
   - Step 2: Email verification (automatic)

3. **Fill out Step 3 (About You):**
   - Enter First Name
   - Enter Last Name
   - Enter City
   - Click **"Continue"** → **This triggers the email!**

---

## 🔍 What to Look For in Console Logs

### **Frontend Logs** (Browser Console)
When you click "Continue" on Step 3, you should see:

```
====================================
📧 FRONTEND - About You Submit (Step 3/18)
====================================
Data: { firstName: "...", lastName: "...", city: "..." }
Event Name: The 500
Is In Specific Event Flow: true
====================================
📤 Sending to API: { firstName: "...", lastName: "...", city: "...", eventName: "The 500" }
✅ API call completed successfully
```

### **Backend Logs** (Server Console / Supabase Edge Function Logs)
After the API call, the backend will log:

```
====================================
📧 ABOUT YOU - STEP 3/18 TRIGGERED
====================================
User: user@example.com
Event Name: The 500
Data: { firstName: "...", lastName: "...", city: "..." }
====================================
✅ User profile updated successfully
📧 ABOUT_YOU - EMAIL TRIGGER INITIATED
   → Event Name: The 500
   → Recipient (from auth): user@example.com    ← AUTH TOKEN (source of truth)
   → Recipient (from DB): user@example.com      ← Database record
   → Display Name: First Last
📊 Event Lookup Result: { found: true, error: null, eventData: {...} }
📨 Calling sendRideRegistrationEmail with:
   → Email (USING AUTH EMAIL): user@example.com  ← Always uses auth email!
   → Name: First Last
   → Ride: The 500
   → Date: January 15, 2025
   → Event ID: abc123
   → Is Subscriber: false
📧 EMAIL RESULT: { success: true, messageId: "..." }
✅ ✅ ✅ RIDE REGISTRATION EMAIL SENT SUCCESSFULLY!
   → Recipient: user@example.com
   → Message ID: ...
====================================
✅ ABOUT YOU ENDPOINT COMPLETE
====================================
```

---

## ❌ Troubleshooting

### **Problem: No email sent**

#### Check 1: Frontend not sending eventName
**Log to look for:**
```
Event Name: NOT PROVIDED
```
**Fix:** Verify the user is in a specific event flow (selected a ride before starting onboarding)

---

#### Check 2: Event not found in database
**Log to look for:**
```
❌ Event not found or not published: { eventName: "...", error: {...} }
```
**Fix:** 
- Check that the event exists in the database
- Verify `is_published = true` in the events table
- Confirm the event name matches exactly

---

#### Check 3: Email not triggered
**Log to look for:**
```
⚠️  EMAIL NOT TRIGGERED - Reason: { hasEventName: false, hasUpdatedUser: false }
```
**Fix:**
- `hasEventName: false` → Frontend didn't send the event name
- `hasUpdatedUser: false` → Database update failed (check earlier logs)

---

#### Check 4: MailerSend API failure
**Log to look for:**
```
❌ RIDE REGISTRATION EMAIL FAILED!
   → Error: ...
```
**Fix:**
- Verify `MAILERSEND_API_KEY` environment variable is set
- Check MailerSend API status
- Verify sender email is verified in MailerSend dashboard
- Check MailerSend API quota/limits

---

## 📬 Email Content Includes

When successful, the email will contain:

✅ **Personalized greeting** with user's display name  
✅ **Ride details** (name, date)  
✅ **Phase 1 (Register)** - In Progress with 3 steps:
   - Step 1: Set username
   - Step 2: Emergency contact
   - Step 3: Equipment checklist

✅ **Phase 2 (Start Line)** - Locked until ride day:
   - Check-in instructions
   - 200 points for showing up

✅ **Phase 3 (End)** - Locked until completion:
   - Proof of completion submission
   - Variable points for finishing

✅ **Subscriber-aware GPX messaging**  
✅ **Link to continue registration:** `hub.gravalist.com/ride/{rideId}`  
✅ **Important reminders** about self-managed nature  
✅ **HubSpot BCC** for tracking (gravalistemail@hs-inbox.com)

---

## 🎯 Expected Behavior

| Step | Action | Email Sent? |
|------|--------|-------------|
| 1    | Enter email & password | ❌ No |
| 2    | Email verification | ❌ No |
| **3**    | **Click "Continue" on About You** | **✅ YES** |
| 4-18 | Continue through other steps | ❌ No |

---

## 🔧 Quick Debug Checklist

- [ ] User selected a ride before starting onboarding
- [ ] Browser console shows event name being sent
- [ ] Server logs show "ABOUT YOU - STEP 3/18 TRIGGERED"
- [ ] Server logs show event found in database
- [ ] Server logs show "Calling sendRideRegistrationEmail"
- [ ] Server logs show "EMAIL SENT SUCCESSFULLY"
- [ ] MAILERSEND_API_KEY is set in environment
- [ ] Check user's email inbox (including spam folder)

---

## 💡 Pro Tips

1. **Check spam folder** - First emails from new domain may be filtered
2. **Use console.log filtering** - Search for "📧" emoji to see only email-related logs
3. **Test with real email** - Use your own email for testing
4. **Check MailerSend dashboard** - View sent emails and delivery status
5. **Non-blocking** - Email failures won't prevent profile update from succeeding
