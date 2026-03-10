import { createClient } from 'npm:@supabase/supabase-js@2'

const MAILERSEND_API_URL = 'https://api.mailersend.com/v1';
const SENDER_EMAIL = Deno.env.get('MAILERSEND_SENDER_EMAIL') || 'noreply@gravalist.com';
const SENDER_NAME = 'Gravalist Analytics';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendEmail(params: any): Promise<boolean> {
    const apiKey = Deno.env.get('MAILERSEND_API_KEY');

    if (!apiKey) {
        console.error('MAILERSEND - API key missing');
        return false;
    }

    try {
        const payload = {
            from: params.from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text,
        };

        const response = await fetch(`${MAILERSEND_API_URL}/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('MAILERSEND - API error:', await response.text());
            return false;
        }

        console.log('MAILERSEND - Email sent successfully!');
        return true;
    } catch (error) {
        console.error('MAILERSEND - Exception sending email:', error);
        return false;
    }
}

async function prepareAndSendReport() {
    console.log('DAILY REPORT - Starting metric collection...');

    // Calculate timelines - last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const yesterdayStr = yesterday.toISOString();

    // 1. Total New Sign-Ups
    const { data: newUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .gte('created_at', yesterdayStr);

    if (usersError) console.error('Error fetching new users:', usersError);
    const newSignups = newUsers?.length || 0;

    // 2. Total New Premium Subscriptions (Sales)
    const { data: newPremium, error: premiumError } = await supabase
        .from('users')
        .select('id, email, subscription_started_at')
        .eq('is_premium_subscriber', true)
        .gte('subscription_started_at', yesterdayStr);

    if (premiumError) console.error('Error fetching premium users:', premiumError);
    const newSales = newPremium?.length || 0;
    // Estimate revenue (assuming $39/year hardcoded for now, or based on real pricing)
    const estimatedRevenue = newSales * 39;

    // 3. Total New Route Registrations
    const { data: newRegs, error: regsError } = await supabase
        .from('user_events')
        .select('id, event_id, current_step_id, registered_at')
        .gte('registered_at', yesterdayStr);

    if (regsError) console.error('Error fetching new registrations:', regsError);
    const newRouteRegistrations = newRegs?.length || 0;

    // 4. Highest Onboarding Step Reached Today
    let highestStep = 0;
    newRegs?.forEach(reg => {
        if (reg.current_step_id > highestStep) {
            highestStep = reg.current_step_id;
        }
    });

    console.log('DAILY REPORT - Metrics Collected', {
        newSignups, newSales, estimatedRevenue, newRouteRegistrations, highestStep
    });

    // 5. Send Email
    const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 20px; color: #18181b; }
      .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
      h2 { color: #FF6A00; margin-top: 0; }
      .metric { padding: 15px; border-bottom: 1px solid #e4e4e7; display: flex; justify-content: space-between; align-items: center; }
      .metric:last-child { border-bottom: none; }
      .value { font-size: 24px; font-weight: bold; color: #FF6A00; }
      .label { font-size: 16px; color: #52525b; font-weight: 500; }
      .footer { margin-top: 30px; font-size: 12px; color: #a1a1aa; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Gravalist Daily Report</h2>
      <p>Here is your automated performance summary for the last 24 hours.</p>
      
      <div class="metric">
        <span class="label">New User Sign-Ups</span>
        <span class="value">${newSignups}</span>
      </div>
      
      <div class="metric">
        <span class="label">New Route Registrations</span>
        <span class="value">${newRouteRegistrations}</span>
      </div>
      
      <div class="metric">
        <span class="label">Highest Onboarding Step Reached</span>
        <span class="value">Step ${highestStep}</span>
      </div>

      <div class="metric" style="background-color: #fff7ed; border-radius: 6px; margin-top: 15px; border: 1px solid #fed7aa;">
        <span class="label" style="color: #ea580c;">New Premium Subscriptions (Sales)</span>
        <span class="value">${newSales}</span>
      </div>
      
      <div class="metric" style="background-color: #fff7ed; border-radius: 6px; margin-top: 5px; border: 1px solid #fed7aa;">
        <span class="label" style="color: #ea580c;">Estimated New Revenue</span>
        <span class="value">$${estimatedRevenue}</span>
      </div>

      <div class="footer">
        Automated report generated at ${now.toUTCString()}
      </div>
    </div>
  </body>
  </html>
  `;

    const text = `
  Gravalist Daily Report
  Summary for the last 24 hours:

  New User Sign-Ups: ${newSignups}
  New Route Registrations: ${newRouteRegistrations}
  Highest Onboarding Step Reached Today: Step ${highestStep}
  New Premium Subscriptions (Sales): ${newSales}
  Estimated New Revenue: $${estimatedRevenue}
  `;

    await sendEmail({
        from: { email: SENDER_EMAIL, name: SENDER_NAME },
        to: [{ email: 'hello@gravalist.com' }],
        subject: `Gravalist Daily Report - ${now.toISOString().split('T')[0]}`,
        html,
        text
    });
}

// Handler for the Edge Function invocation
Deno.serve(async (req) => {
    // Optional: Add a simple security key check if invoking via HTTP trigger instead of pg_cron directly
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization');

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // Check auth - pg_cron will send the service role key or a custom secret
    if (authHeader !== `Bearer ${supabaseKey}` && url.searchParams.get('secret') !== Deno.env.get('CRON_SECRET')) {
        console.error('DAILY REPORT - Unauthorized invocation attempt');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        await prepareAndSendReport();
        return new Response(JSON.stringify({ success: true, message: 'Report sent successfully' }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error('DAILY REPORT - Fatal error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
});
