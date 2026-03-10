# Stripe Webhook Integration & DevOps Guide

## Overview
This document outlines the architecture, flow, and deployment process for the Stripe Webhook integration within the `gravalist.com` project. The backend webhook listener is hosted on a **Supabase Edge Function** (`make-server-91bdaa9f`).

This guide serves as a reference for future developers and AI agents to understand how payments are processed and how to maintain the infrastructure.

---

## 🏗 Architecture & Flow

The payment flow involves three main components: the React Frontend (hosted on Vercel), Stripe, and the Supabase Edge Function backend.

### 1. Payment Initiation
- User clicks "Upgrade" on the frontend (`/upgrade`).
- Frontend calls the Edge Function endpoint: `POST /make-server-91bdaa9f/stripe/create-checkout-session`.
- The Edge Function securely creates a Stripe Checkout Session using the `STRIPE_SECRET_KEY` and passes the user's `id` and `email` as `metadata` to Stripe.
- The user is redirected to the Stripe Checkout page.

### 2. Webhook Processing
- Upon successful payment (or subscription changes), Stripe fires a webhook event to the Edge Function endpoint: `POST /make-server-91bdaa9f/stripe/webhook`.
- The Edge Function receives the event payload. 
  - **CRITICAL NOTE:** The endpoint must allow unauthenticated requests, so it is deployed with JWT verification disabled (`--no-verify-jwt`). Stripe does not send Bearer tokens.
- The webhook script (`src/supabase/functions/server/index.tsx`) parses the event:
  - `checkout.session.completed`: Upgrades the user based on metadata.
  - `customer.subscription.created`: Backup trigger to ensure the user is upgraded.
  - `customer.subscription.updated`: Handles plan changes or renewals.
  - `customer.subscription.deleted`: Downgrades the user if a subscription is canceled.
- The user's database record (`users` table) is updated with their new premium status and Stripe IDs.

---

## 🚀 DevOps & Deployment

The Edge Function code lives in the `gravalist.com` repository under `src/supabase/functions/server/index.tsx`. 

### Prerequisites
To deploy changes to the webhook, you need the Supabase CLI installed and authenticated to the live project (`sczqurjsiiaopszmuaof`).

```bash
npm install -g supabase
supabase login
```

### Deployment Steps
Because the function resides in a uniquely named folder structure and requires specific flags, follow these exact steps to redeploy it.

1. **Navigate to the functions directory:**
   ```bash
   cd src/supabase/functions
   ```

2. **Temporarily rename the directory to match the function name (required by Supabase CLI):**
   ```bash
   mv server make-server-91bdaa9f
   ```

3. **Deploy the function:**
   *Important: You must use the `--no-verify-jwt` flag so Stripe requests aren't blocked.*
   ```bash
   npx supabase functions deploy make-server-91bdaa9f --no-verify-jwt --project-ref sczqurjsiiaopszmuaof
   ```

4. **Restore the original directory name:**
   ```bash
   mv make-server-91bdaa9f server
   ```

*(For convenience, these steps can be combined into a single command as demonstrated in previous DevOps tasks).*

---

## 🛠 Maintenance & Security

### Environment Variables
The Edge Function relies on environment variables set within the Supabase Dashboard:
- `STRIPE_SECRET_KEY`: Used to communicate with the Stripe API.
- `STRIPE_WEBHOOK_SECRET`: Used to cryptographically verify incoming Stripe webhooks.
- `STRIPE_PRICE_ID`: (Optional) Fallback price ID if not supplied by the frontend.
- `SUPABASE_URL` / `SUPABASE_ANON_KEY`: Used by the Supabase client inside the function.

### Security Implementation 🔐
The `/stripe/webhook` endpoint uses Stripe's native `webhooks.constructEventAsync()` logic to verify the cryptographic `Stripe-Signature` header. This ensures all requests are authentically originating from Stripe and prevents malicious actors from spoofing premium upgrades.

If the `STRIPE_WEBHOOK_SECRET` is not configured, the endpoint will fall back to blindly parsing the JSON payload for testing purposes, but this behavior will emit a loud warning in the logs.

### Troubleshooting
If webhooks are failing:
1. **Check Edge Function Logs:** Go to the Supabase Dashboard -> Edge Functions -> `make-server-91bdaa9f` -> Logs. Look for syntax errors or `User not found` errors.
2. **Verify 401 Errors:** If Stripe is receiving `401 Unauthorized` errors, it means the function was accidentally deployed without the `--no-verify-jwt` flag. Redeploy using the instructions above.
3. **Check Stripe Dashboard:** Go to Stripe -> Developers -> Webhooks to ensure the webhook endpoint is configured correctly and see the delivery success rate.
