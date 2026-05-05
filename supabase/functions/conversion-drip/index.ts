import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const mailersendApiKey = Deno.env.get('MAILERSEND_API_KEY')
    if (!mailersendApiKey) {
      throw new Error('MAILERSEND_API_KEY missing from environment.')
    }

    // Determine target users: Users created exactly 3 days ago (or between 3 and 4 days) who have NOT subscribed
    const threeDaysAgoObj = new Date()
    threeDaysAgoObj.setDate(threeDaysAgoObj.getDate() - 3)
    
    const fourDaysAgoObj = new Date()
    fourDaysAgoObj.setDate(fourDaysAgoObj.getDate() - 4)

    const threeDaysAgoStr = threeDaysAgoObj.toISOString()
    const fourDaysAgoStr = fourDaysAgoObj.toISOString()

    const { data: users, error: dbError } = await supabaseClient
      .from('users')
      .select('email, first_name, billing_status, created_at')
      .neq('billing_status', 'active')
      .lt('created_at', threeDaysAgoStr)
      .gt('created_at', fourDaysAgoStr)

    if (dbError) throw dbError

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No users require conversion emails today.' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const emailPromises = users.filter(u => u.email).map((user) => {
      const emailPayload = {
        from: {
          email: 'hello@gravalist.com',
          name: 'Gravalist HQ'
        },
        to: [
          {
            email: user.email,
            name: user.first_name || 'Gravalist Rider'
          }
        ],
        subject: 'Unlock the Ultimate Gravel Experience 🚲',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <h2>The gravel roads are yours. And they are free.</h2>
            <p>Hi ${user.first_name || 'Rider'},</p>
            <p>You registered with Gravalist a few days ago, but you haven't unlocked the full potential of your account yet.</p>
            <p>Our platform is 100% independent. No fussy corporate sponsors, no timing chips. Just pure, unadulterated gravel.</p>
            <p>By upgrading to <strong>Premium</strong> today, you immediately unlock:</p>
            <ul>
              <li><strong>Exclusive GPX Route Downloads</strong></li>
              <li>Official Leaderboard Rankings</li>
              <li>Community Support Hub Access</li>
            </ul>
            <p>Support an independent platform and step up your riding today:</p>
            <a href="https://gravalist.com/upgrade" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Unlock Premium Now</a>
            <br><br>
            <p>See you out there,<br>The Gravalist Team</p>
          </div>
        `
      }

      return fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailersendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      })
    })

    const results = await Promise.allSettled(emailPromises)
    const successCount = results.filter(r => r.status === 'fulfilled').length

    return new Response(JSON.stringify({ 
      success: true, 
      processed: users.length, 
      sent: successCount 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Error during conversion drip:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
