# Stripe Setup Instructions

## Required Environment Variables

The following Stripe environment variables need to be configured:

### 1. STRIPE_SECRET_KEY
- Already configured ✅
- This is your Stripe secret key from your dashboard

### 2. STRIPE_PUBLISHABLE_KEY  
- Already configured ✅
- This is your Stripe publishable key from your dashboard

### 3. STRIPE_PRICE_ID
- **Newly created** - You need to set this value
- This should be the price ID for your annual subscription product

## How to Find Your Stripe Price ID

1. Go to your Stripe Dashboard
2. Navigate to **Products** in the left sidebar
3. Find your annual subscription product ($169/year)
4. Click on the product to view details
5. Look for the **Price** section
6. Copy the Price ID (it starts with `price_`)
   - Example: `price_1QTVJlANT1yLdvVBaApU0yc4`

## Setting the Environment Variable

In the Figma Make environment, you should see a modal asking you to provide the `STRIPE_PRICE_ID`. 

Paste your actual Stripe price ID there.

## Testing the Integration

After setting the price ID:

1. Try clicking "Upgrade Now" on the Subscribe page
2. You should be redirected to Stripe Checkout
3. Complete a test transaction (use Stripe test card: `4242 4242 4242 4242`)
4. After payment, you should be redirected back to the success page

## Webhook Setup (Important!)

For the subscription to work properly, you need to configure webhooks in Stripe:

1. In your Stripe Dashboard, go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://[your-project-id].supabase.co/functions/v1/make-server-91bdaa9f/stripe/webhook`
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created` 
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Save the webhook

## Troubleshooting

If you get errors:

1. **"Payment system not configured"**: STRIPE_SECRET_KEY is missing
2. **"Failed to create checkout session"**: Usually means the STRIPE_PRICE_ID is incorrect
3. **"No such price"**: The price ID doesn't exist in your Stripe account

Check the browser console and server logs for more detailed error messages.