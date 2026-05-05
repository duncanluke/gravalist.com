// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse the payload sent from Supabase Database Webhook or Application
    const payload = await req.json()
    console.log('Received CRM sync event:', JSON.stringify(payload))

    const webhookUrl = Deno.env.get('CRM_WEBHOOK_URL')
    if (!webhookUrl) {
      throw new Error('Missing CRM_WEBHOOK_URL environment variable')
    }

    // Determine the data structure based on the source
    // We expect this to be called from a Database Webhook on the `users` table
    let userData = null
    let action = 'Update'

    if (payload.type === 'INSERT' || payload.type === 'UPDATE') {
      // It's a database webhook
      userData = payload.record
    } else {
      // It's a direct API call
      userData = payload
    }

    if (!userData || !userData.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload - missing email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Map Supabase User data to the format expected by our Apps Script webhook
    const crmData = {
      user_id: userData.id || userData.user_id,
      email: userData.email,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      status: userData.stripe_customer_id ? (userData.billing_status === 'active' ? 'Subscriber' : 'Lead') : 'Lead',
      ltv: userData.ltv || 0,
      last_action: userData.last_sign_in_at ? 'Signed In' : 'Created'
    }

    // Push the payload to Google Apps Script
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(crmData),
    })

    const responseText = await response.text()
    console.log('CRM Webhook Response:', response.status, responseText)

    if (!response.ok) {
      throw new Error(`Failed to push to CRM: ${response.status} ${responseText}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'CRM synced successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('CRM Sync Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
