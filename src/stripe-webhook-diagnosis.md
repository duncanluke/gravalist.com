# 🔍 Stripe Webhook Diagnosis & Fix Guide

## 🚨 Current Issue
Users complete Stripe payments successfully but their premium status isn't updated in the database. The header still shows "Subscribe" instead of "Premium".

## 🧪 Debug Tools Available

### 1. **Debug Panel** (in /upgrade page)
- Click "Show Debug Options" in the upgrade page
- Available tools:
  - **Test Premium Update**: Manually triggers webhook simulation
  - **Check User Status**: Shows current database values
  - **Test Webhook Config**: Checks environment and connectivity
  - **🚨 Force Premium Status**: Emergency override (sets premium manually)

### 2. **Server Debug Endpoints**
```bash
# Check webhook configuration
POST https://[project].supabase.co/functions/v1/make-server-91bdaa9f/debug/webhook-test

# Check user's current status
GET https://[project].supabase.co/functions/v1/make-server-91bdaa9f/debug/user-status
Authorization: Bearer [user_access_token]

# Manually trigger webhook simulation
POST https://[project].supabase.co/functions/v1/make-server-91bdaa9f/debug/trigger-webhook
Authorization: Bearer [user_access_token]

# Emergency premium override
POST https://[project].supabase.co/functions/v1/make-server-91bdaa9f/debug/force-premium
Authorization: Bearer [user_access_token]
```

## 🔍 Three Main Issues to Check

### Issue #1: Webhook Not Receiving Events

**Problem**: Stripe isn't sending webhooks to our server
**Solution**: Configure Stripe webhook endpoint

1. **Go to Stripe Dashboard** → Webhooks
2. **Add endpoint**: `https://[your-project].supabase.co/functions/v1/make-server-91bdaa9f/stripe/webhook`
3. **Select events**: 
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Test**: Use "Test Webhook Config" button

### Issue #2: User Lookup Failing

**Problem**: Webhook can't find user in database
**Symptoms**: Logs show "No user found for checkout session"

**Root Causes**:
- Metadata missing from checkout session
- User ID/email mismatch
- Database user record not found

**Fix Applied**:
- Enhanced user lookup (tries ID first, then email)
- Better error logging
- Fallback to customer email

### Issue #3: Database Update Failing Silently

**Problem**: Database update fails but no error reported
**Symptoms**: Webhook processes but premium status unchanged

**Root Causes**:
- Supabase connection issues
- Wrong table/column names
- Permission issues

**Fix Applied**:
- Added verification step after update
- Enhanced error handling and logging
- Better database error reporting

## 🎯 Immediate Testing Steps

### Step 1: Check Current Status
```javascript
// In browser console on /upgrade page
// Click "Check User Status" button and look for:
{
  "database_user": {
    "is_premium_subscriber": false,  // Should be true
    "subscription_status": null      // Should be "active"
  }
}
```

### Step 2: Test Webhook Configuration
```javascript
// Click "Test Webhook Config" button
// All tests should pass:
- Environment Variables ✅
- Database Connection ✅  
- Webhook URL Format ✅
- Mock Session Structure ✅
```

### Step 3: Manual Override (Emergency)
```javascript
// If webhook is broken, use emergency fix:
// Click "🚨 Force Premium Status" button
// This bypasses Stripe and sets premium directly
```

## 🔧 Enhanced Logging

The webhook now logs:
- Full event details
- User lookup attempts (by ID and email)
- Database update results
- Verification of premium status

## 🚀 Stripe Dashboard Configuration

**Webhook URL**: `https://[project-id].supabase.co/functions/v1/make-server-91bdaa9f/stripe/webhook`

**Required Events**:
- `checkout.session.completed` - Main event for payment completion
- `customer.subscription.created` - Backup subscription tracking
- `customer.subscription.updated` - Handle plan changes
- `customer.subscription.deleted` - Handle cancellations

## 📊 Expected Flow

1. **User clicks "Upgrade Now"** → Creates Stripe checkout with metadata
2. **User completes payment** → Stripe sends `checkout.session.completed` webhook
3. **Webhook handler** → Finds user by ID/email, updates database
4. **Frontend refreshes** → Header shows "Premium" instead of "Subscribe"

## 🔍 Most Likely Issue

Based on your setup, the most likely issue is **#1: Webhook not configured in Stripe Dashboard**. 

**Quick Fix**: 
1. Go to Stripe Dashboard → Webhooks
2. Add the webhook endpoint URL
3. Select the required events
4. Test with a new payment

## 🆘 Emergency Recovery

If webhooks are completely broken, users can:
1. Go to `/upgrade` page
2. Click "Show Debug Options"
3. Click "🚨 Force Premium Status"
4. Their account will be manually upgraded to premium

This bypasses Stripe entirely and directly updates the database.