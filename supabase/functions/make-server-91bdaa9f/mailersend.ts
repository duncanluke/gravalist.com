const MAILERSEND_API_URL = 'https://api.mailersend.com/v1';

// Email sender configuration
const SENDER_EMAIL = Deno.env.get('MAILERSEND_SENDER_EMAIL') || 'noreply@gravalist.com';
const SENDER_NAME = 'Gravalist';

// Logo - Using inline SVG for maximum email client compatibility
// This ensures the logo always displays regardless of external URL availability
// SVG with white text on transparent background - compatible with dark email backgrounds
const LOGO_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 60'%3E%3Ctext x='0' y='42' font-family='Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' font-size='36' font-weight='700' fill='%23FFFFFF' letter-spacing='-1'%3EGRAVALIST%3C/text%3E%3C/svg%3E`;

// Alternative: If you upload the logo to Supabase Storage, uncomment and use this:
// const LOGO_URL = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/make-91bdaa9f-public-assets/gravalist-logo-white.png`;

// Use SVG as primary for reliability - it will always work in emails
const LOGO_URL = LOGO_SVG;

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailParams {
  from: EmailRecipient;
  to: EmailRecipient[];
  subject: string;
  html: string;
  text: string;
  bcc?: EmailRecipient[];
}

/**
 * Base function to send emails via MailerSend API
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = Deno.env.get('MAILERSEND_API_KEY');

  if (!apiKey) {
    console.error('❌ MAILERSEND - API key not configured');
    console.error('❌ MAILERSEND - Please ensure MAILERSEND_API_KEY environment variable is set');
    console.error('❌ MAILERSEND - Without this, welcome emails cannot be sent');
    console.error('❌ MAILERSEND - Set it in: Supabase Dashboard → Edge Functions → Secrets');
    return { success: false, error: 'Email service not configured - MAILERSEND_API_KEY missing' };
  }

  console.log('✅ MAILERSEND - API key configured:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

  try {
    console.log('📧 MAILERSEND - Preparing to send email');
    console.log('   → To:', params.to.map(r => r.email).join(', '));
    console.log('   → Subject:', params.subject);
    if (params.bcc) {
      console.log('   → BCC:', params.bcc.map(r => r.email).join(', '));
    }

    const payload = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      ...(params.bcc && { bcc: params.bcc })
    };

    console.log('📧 MAILERSEND - Calling API at:', `${MAILERSEND_API_URL}/email`);

    const response = await fetch(`${MAILERSEND_API_URL}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ MAILERSEND - API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        success: false,
        error: `Failed to send email: ${response.status} ${response.statusText} - ${errorText}`
      };
    }

    // MailerSend returns X-Message-Id header
    const messageId = response.headers.get('X-Message-Id');
    console.log('✅ MAILERSEND - Email sent successfully!');
    console.log('   → Message ID:', messageId);

    return { success: true, messageId: messageId || undefined };
  } catch (error) {
    console.error('❌ MAILERSEND - Exception sending email:', error);
    console.error('   → Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('   → Error message:', error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send an invitation email to a friend
 */
export async function sendInvitationEmail(
  inviterName: string,
  recipientEmail: string,
  inviterEmail?: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join Gravalist</title>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 0 0 40px 0; text-align: center;">
              <img src="${LOGO_URL}" alt="Gravalist" style="height: 48px; max-width: 100%; margin-bottom: 8px;" />
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">
                Unsupported Ultracycling
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 40px;">
              
              <!-- Title -->
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff;">
                ${inviterName} invited you to join Gravalist
              </h2>

              <!-- Subtitle -->
              <p style="margin: 0 0 32px 0; font-size: 16px; text-align: center; color: #FF6A00; font-weight: 500;">
                Take control of your own ultracycling adventures
              </p>

              <!-- Introduction -->
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                <strong style="color: #ffffff;">${inviterName}</strong> thinks you'd be a great fit for the Gravalist community—a self-managed ultra event platform where riders organize everything themselves with no official support.
              </p>

              <!-- What is Gravalist -->
              <div style="background-color: rgba(255, 106, 0, 0.05); border-left: 3px solid #FF6A00; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #FF6A00;">What is Gravalist?</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cccccc;">
                  A platform for self-managed ultracycling events. Choose your ride, register yourself, track your progress, and take full ownership of your experience. <strong style="color: #ffffff;">My tracking, my responsibility.</strong>
                </p>
              </div>

              <!-- How It Works -->
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff; text-align: center;">How It Works</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0;">
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">1️⃣</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Register:</strong> Choose a ride and complete the 3-phase onboarding</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">2️⃣</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Start Line:</strong> Check in on ride day to confirm you showed up</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">3️⃣</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">End:</strong> Submit your time and tracking data when finished</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">🏆</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Compete:</strong> Earn points and climb the global leaderboard</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="https://gravalist.com" style="display: inline-block; background-color: #FF6A00; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Join Gravalist
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer Note -->
              <p style="margin: 0; font-size: 13px; text-align: center; color: #666666;">
                Join a community of riders who take full responsibility for their own adventures.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">
                My tracking, my responsibility.
              </p>
              <p style="margin: 0; font-size: 12px; color: #444444;">
                Questions? Visit <a href="https://gravalist.com" style="color: #FF6A00; text-decoration: none;">gravalist.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
${inviterName} invited you to join Gravalist!

${inviterName} thinks you'd be a great fit for the Gravalist community—a self-managed ultra event platform where riders organize everything themselves with no official support.

WHAT IS GRAVALIST?
A platform for self-managed ultracycling events. Choose your ride, register yourself, track your progress, and take full ownership of your experience. My tracking, my responsibility.

HOW IT WORKS
1️⃣ Register: Choose a ride and complete the 3-phase onboarding
2️⃣ Start Line: Check in on ride day to confirm you showed up
3️⃣ End: Submit your time and tracking data when finished
🏆 Compete: Earn points and climb the global leaderboard

Join Gravalist: https://gravalist.com

Join a community of riders who take full responsibility for their own adventures.

My tracking, my responsibility.
  `;

  return sendEmail({
    from: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [{ email: recipientEmail }],
    bcc: [{ email: '139710685@bcc.eu1.hubspot.com' }],
    subject: `${inviterName} invited you to join Gravalist`,
    html,
    text
  });
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || 'Rider';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Gravalist</title>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 0 0 40px 0; text-align: center;">
              <img src="${LOGO_URL}" alt="Gravalist" style="height: 48px; max-width: 100%; margin-bottom: 8px;" />
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">
                Unsupported Ultracycling
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 40px;">
              
              <!-- Title -->
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff;">
                Welcome to Gravalist, ${displayName}
              </h2>

              <!-- Subtitle -->
              <p style="margin: 0 0 32px 0; font-size: 16px; text-align: center; color: #FF6A00; font-weight: 500;">
                Breathe. You've got this.
              </p>

              <!-- Introduction -->
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                You've just joined a community of riders who take full responsibility for their own adventures. <strong style="color: #ffffff;">No official support. No organizers.</strong> Just you, your bike, and the open road.
              </p>

              <!-- What is Gravalist -->
              <div style="background-color: rgba(255, 106, 0, 0.05); border-left: 3px solid #FF6A00; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #FF6A00;">What is Gravalist?</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cccccc;">
                  Gravalist is a <strong style="color: #ffffff;">self-managed ultra event platform</strong> where riders organize everything themselves. Think of it as a framework for your own adventure—you choose your ride, register yourself, track your progress, and take full ownership of your experience.
                </p>
              </div>

              <!-- How It Works -->
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff; text-align: center;">How It Works: 3 Simple Phases</h3>

              <!-- Phase 1 -->
              <div style="margin: 0 0 20px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 6px; padding: 16px;">
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: #FF6A00; color: #000000; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">1</span>
                    <h4 style="margin: 0; font-size: 16px; color: #ffffff;">Register Phase</h4>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #999999; padding-left: 44px;">
                    Choose a ride and register yourself. Set your username and confirm your email.
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #666666; padding-left: 44px;">
                    ✓ You earn <strong style="color: #FF6A00;">100 points</strong> just for registering
                  </p>
                </div>
              </div>

              <!-- Phase 2 -->
              <div style="margin: 0 0 20px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 6px; padding: 16px;">
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: #FF6A00; color: #000000; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">2</span>
                    <h4 style="margin: 0; font-size: 16px; color: #ffffff;">Start Line</h4>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #999999; padding-left: 44px;">
                    On ride day, check in at the start line to confirm you showed up.
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #666666; padding-left: 44px;">
                    ✓ You earn <strong style="color: #FF6A00;">200 points</strong> for starting your ride
                  </p>
                </div>
              </div>

              <!-- Phase 3 -->
              <div style="margin: 0 0 32px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 6px; padding: 16px;">
                  <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: #FF6A00; color: #000000; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">3</span>
                    <h4 style="margin: 0; font-size: 16px; color: #ffffff;">End</h4>
                  </div>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #999999; padding-left: 44px;">
                    When you finish, submit your completion time and upload your tracking data.
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #666666; padding-left: 44px;">
                    ✓ Completion earns you even more points and leaderboard status
                  </p>
                </div>
              </div>

              <!-- Subscription Promotion -->
              <div style="background-color: rgba(255, 106, 0, 0.1); border: 2px solid #FF6A00; border-radius: 8px; padding: 24px; margin: 0 0 32px 0; text-align: center;">
                <h3 style="margin: 0 0 12px 0; font-size: 20px; color: #FF6A00;">🗺️ Upgrade to Access Route Files</h3>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                  Get a <strong style="color: #ffffff;">Gravalist subscription</strong> to download GPX route files for all rides. Navigate with confidence using professionally mapped routes on your GPS device.
                </p>
                <p style="margin: 0; font-size: 14px; color: #999999;">
                  ✓ Unlimited GPX downloads &nbsp;•&nbsp; ✓ All current & future routes &nbsp;•&nbsp; ✓ Premium support
                </p>
              </div>

              <!-- What You Can Do -->
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff; text-align: center;">What You Can Do</h3>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 32px 0;">
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">🚴</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Browse Rides:</strong> Explore upcoming ultra events and choose your adventure</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">📍</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Register & Track:</strong> Sign up for rides and track your progress through each phase</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">🏆</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Earn Points:</strong> Climb the global leaderboard and compete with the community</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">🗺️</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Download Routes:</strong> Subscribe to access GPX files for all rides</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; vertical-align: top;">
                    <span style="color: #FF6A00; font-size: 18px; margin-right: 12px;">👥</span>
                    <span style="font-size: 15px; color: #cccccc;"><strong style="color: #ffffff;">Invite Friends:</strong> Share the adventure and earn 25 points per invite</span>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background-color: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 6px; padding: 20px; margin: 0 0 32px 0;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #FF6A00;">Ready to Start?</h3>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #cccccc; line-height: 1.6;">
                  Your first step is to <strong style="color: #ffffff;">select a ride that challenges you</strong> and complete the registration process. Browse our available rides, pick one that excites you, and begin your 3-phase onboarding journey.
                </p>
                <p style="margin: 0; font-size: 14px; color: #999999;">
                  Each ride has its own registration flow, start line check-in, and finish submission. The adventure is yours to own.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="https://gravalist.com" style="display: inline-block; background-color: #FF6A00; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Select a Ride & Register
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">
                My tracking, my responsibility.
              </p>
              <p style="margin: 0; font-size: 12px; color: #444444;">
                Questions? Visit <a href="https://gravalist.com" style="color: #FF6A00; text-decoration: none;">gravalist.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to Gravalist, ${displayName}!

Breathe. You've got this.

You've just joined a community of riders who take full responsibility for their own adventures. No official support. No organizers. Just you, your bike, and the open road.

WHAT IS GRAVALIST?
Gravalist is a self-managed ultra event platform where riders organize everything themselves. Think of it as a framework for your own adventure—you choose your ride, register yourself, track your progress, and take full ownership of your experience.

HOW IT WORKS: 3 SIMPLE PHASES

1. REGISTER PHASE
   Choose a ride and register yourself. Set your username and confirm your email.
   ✓ You earn 100 points just for registering

2. START LINE
   On ride day, check in at the start line to confirm you showed up.
   ✓ You earn 200 points for starting your ride

3. END
   When you finish, submit your completion time and upload your tracking data.
   ✓ Completion earns you even more points and leaderboard status

🗺️ UPGRADE TO ACCESS ROUTE FILES
Get a Gravalist subscription to download GPX route files for all rides. Navigate with confidence using professionally mapped routes on your GPS device.
✓ Unlimited GPX downloads • ✓ All current & future routes • ✓ Premium support

WHAT YOU CAN DO
🚴 Browse Rides: Explore upcoming ultra events and choose your adventure
📍 Register & Track: Sign up for rides and track your progress through each phase
🏆 Earn Points: Climb the global leaderboard and compete with the community
🗺️ Download Routes: Subscribe to access GPX files for all rides
👥 Invite Friends: Share the adventure and earn 25 points per invite

READY TO START?
Your first step is to select a ride that challenges you and complete the registration process. Browse our available rides, pick one that excites you, and begin your 3-phase onboarding journey.

Each ride has its own registration flow, start line check-in, and finish submission. The adventure is yours to own.

Select a Ride & Register: https://gravalist.com

My tracking, my responsibility.
  `;

  return sendEmail({
    from: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [{ email: userEmail }],
    bcc: [{ email: 'hello@gravalist.com', name: 'Gravalist' }, { email: '139710685@bcc.eu1.hubspot.com' }],
    subject: 'Welcome to Gravalist - Select Your First Ride',
    html,
    text
  });
}

/**
 * Send an event follow-up marketing email
 */
export async function sendEventFollowupEmail(
  userEmail: string,
  userName: string,
  eventName: string
): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || 'Rider';

  const html = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Your Adventure Awaits</title>',
    '</head>',
    '<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, \\\'Segoe UI\\\', Roboto, sans-serif; background-color: #000000; color: #ffffff;">',
    '  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #000000;">',
    '    <tr>',
    '      <td align="center" style="padding: 40px 20px;">',
    '        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">',
    '          <tr>',
    '            <td style="padding: 0 0 40px 0; text-align: center;">',
    '              <img src="' + LOGO_URL + '" alt="Gravalist" style="height: 48px; max-width: 100%; margin-bottom: 8px;" />',
    '              <p style="margin: 8px 0 0 0; font-size: 14px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">',
    '                Unsupported Ultracycling',
    '              </p>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 40px;">',
    '              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff;">',
    '                Still thinking about ' + eventName + '?',
    '              </h2>',
    '              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cccccc; text-align: center;">',
    '                Hi ' + displayName + ', we noticed you exploring <strong>' + eventName + '</strong>.',
    '                Are you ready to test your limits?',
    '              </p>',
    '              <div style="background-color: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 6px; padding: 20px; margin: 0 0 32px 0;">',
    '                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #FF6A00;">What makes this unique:</h3>',
    '                <p style="margin: 0 0 12px 0; font-size: 14px; color: #cccccc; line-height: 1.5;">',
    '                  ✓ Raw, unmapped terrain<br>',
    '                  ✓ No corporate fuss—just pure unsupported gravel<br>',
    '                  ✓ The ultimate physical and mental test<br>',
    '                </p>',
    '                <p style="margin: 0; font-size: 14px; color: #999999; line-height: 1.5;">',
    '                  We map the routes, we verify the distances, but after that... you are entirely responsible for yourself.',
    '                </p>',
    '              </div>',
    '              <table role="presentation" style="width: 100%; border-collapse: collapse;">',
    '                <tr>',
    '                  <td align="center">',
    '                    <a href="https://gravalist.com/ride/' + encodeURIComponent(eventName) + '" style="display: inline-block; background-color: #FF6A00; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">',
    '                      Enter ' + eventName + ' Now',
    '                    </a>',
    '                  </td>',
    '                </tr>',
    '              </table>',
    '            </td>',
    '          </tr>',
    '          <tr>',
    '            <td style="padding: 32px 0 0 0; text-align: center;">',
    '              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">',
    '                My tracking, my responsibility.',
    '              </p>',
    '            </td>',
    '          </tr>',
    '        </table>',
    '      </td>',
    '    </tr>',
    '  </table>',
    '</body>',
    '</html>'
  ].join('\n');

  const text = [
    'Still thinking about ' + eventName + '?',
    '',
    'Hi ' + displayName + ', we noticed you exploring ' + eventName + '. Are you ready to test your limits?',
    '',
    'What makes this unique:',
    '✓ Raw, unmapped terrain',
    '✓ No corporate fuss—just pure unsupported gravel',
    '✓ The ultimate physical and mental test',
    '',
    'Enter Now: https://gravalist.com/ride/' + encodeURIComponent(eventName),
    '',
    'My tracking, my responsibility.'
  ].join('\n');

  return sendEmail({
    from: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [{ email: userEmail, name: displayName }],
    bcc: [{ email: 'hello@gravalist.com', name: 'Gravalist' }, { email: '139710685@bcc.eu1.hubspot.com' }],
    subject: "It's time to ride " + eventName,
    html,
    text
  });
}
/**
 * Send a ride registration confirmation email
 */
export async function sendRideRegistrationEmail(
  userEmail: string,
  userName: string | undefined,
  rideName: string,
  rideDate: string,
  rideId: string,
  isSubscriber: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || 'Rider';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Confirmed: ${rideName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 0 0 40px 0; text-align: center;">
              <img src="${LOGO_URL}" alt="Gravalist" style="height: 48px; max-width: 100%; margin-bottom: 8px;" />
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">
                Unsupported Ultracycling
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 8px; padding: 40px;">
              
              <!-- Success Badge -->
              <div style="text-align: center; margin: 0 0 24px 0;">
                <span style="display: inline-block; background-color: rgba(255, 106, 0, 0.1); color: #FF6A00; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  ✓ Registration Started
                </span>
              </div>

              <!-- Title -->
              <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff;">
                ${rideName}
              </h2>

              <!-- Ride Date -->
              <p style="margin: 0 0 32px 0; font-size: 16px; text-align: center; color: #999999;">
                ${rideDate}
              </p>

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                Hey ${displayName}, <strong style="color: #ffffff;">breathe. You've got this.</strong>
              </p>

              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                You've begun your registration for <strong style="color: #ffffff;">${rideName}</strong>. This is a self-managed ultra ride—no official support, no organizers, just you taking full ownership of your adventure.
              </p>

              <!-- What Happens Next -->
              <div style="background-color: rgba(255, 106, 0, 0.05); border-left: 3px solid #FF6A00; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #FF6A00;">What Happens Next</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cccccc;">
                  Complete the <strong style="color: #ffffff;">18-step registration journey</strong> across 3 phases to be fully registered for ${rideName}. Start now at <strong style="color: #ffffff;">Step 1</strong>—no one is ahead of you. You're beginning from the start like everyone else.
                </p>
              </div>

              <!-- The 3 Phases with All 18 Steps -->
              <h3 style="margin: 0 0 24px 0; font-size: 20px; color: #ffffff; text-align: center;">Your Complete 18-Step Journey</h3>

              <!-- Phase 1: Register (Steps 0-9) -->
              <div style="margin: 0 0 24px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #FF6A00; border-radius: 8px; padding: 20px;">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="display: inline-block; width: 40px; height: 40px; background-color: #FF6A00; color: #000000; border-radius: 50%; text-align: center; line-height: 40px; font-weight: 700; font-size: 18px; margin-right: 16px;">1</span>
                    <h4 style="margin: 0; font-size: 18px; color: #FF6A00;">Register Phase (In Progress - Steps 0-9)</h4>
                  </div>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; color: #ffffff; padding-left: 56px; font-weight: 600;">
                    Complete your registration to earn 100 points
                  </p>

                  <div style="padding-left: 56px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 0:</strong> Email Address</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #FF6A00;"><strong>→ Step 1: Welcome to ${rideName} (You are here)</strong></span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 2:</strong> About You - Basic information</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 3:</strong> Download Route ${!isSubscriber ? '(⚠️ Requires Subscription)' : '(✓ Available)'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 4:</strong> Equipment Checklist</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 5:</strong> Accept Terms & Safety Guidelines</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 6:</strong> Medical Insurance Proof</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 7:</strong> Community Support Agreement</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 8:</strong> Registration Almost Complete</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #cccccc;"><strong style="color: #ffffff;">Step 9:</strong> Ready to Ride - Registration Complete!</span>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top: 16px; padding: 12px; background-color: rgba(255, 106, 0, 0.05); border-radius: 6px;">
                      <p style="margin: 0; font-size: 13px; color: #999999;">
                        ✓ <strong style="color: #FF6A00;">Earn 100 points</strong> when you complete Step 9
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Phase 2: Start Line (Steps 10-14) -->
              <div style="margin: 0 0 24px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #333333; border-radius: 8px; padding: 20px; opacity: 0.7;">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="display: inline-block; width: 40px; height: 40px; background-color: #333333; color: #666666; border-radius: 50%; text-align: center; line-height: 40px; font-weight: 700; font-size: 18px; margin-right: 16px;">2</span>
                    <h4 style="margin: 0; font-size: 18px; color: #666666;">Start Line Phase (Steps 10-14 - Unlocks on ${rideDate})</h4>
                  </div>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; color: #999999; padding-left: 56px; font-weight: 600;">
                    Check in when you arrive to earn 200 points
                  </p>

                  <div style="padding-left: 56px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 10:</strong> Start - Countdown begins</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 11:</strong> Starting Photo - Capture the moment</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 12:</strong> Pre-Ride Check - How are you feeling?</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 13:</strong> Ride Start - Official countdown</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 14:</strong> GO GO GO! - Your adventure begins</span>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top: 16px; padding: 12px; background-color: rgba(255, 255, 255, 0.02); border-radius: 6px;">
                      <p style="margin: 0; font-size: 13px; color: #666666;">
                        ✓ <strong style="color: #999999;">Earn 200 points</strong> for showing up at the start line
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Phase 3: End (Steps 15-17) -->
              <div style="margin: 0 0 32px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #333333; border-radius: 8px; padding: 20px; opacity: 0.7;">
                  <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="display: inline-block; width: 40px; height: 40px; background-color: #333333; color: #666666; border-radius: 50%; text-align: center; line-height: 40px; font-weight: 700; font-size: 18px; margin-right: 16px;">3</span>
                    <h4 style="margin: 0; font-size: 18px; color: #666666;">End Phase (Steps 15-17 - Unlocks After You Finish)</h4>
                  </div>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; color: #999999; padding-left: 56px; font-weight: 600;">
                    Complete your report to appear on the leaderboard
                  </p>

                  <div style="padding-left: 56px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 15:</strong> Welcome Back! - You made it</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 16:</strong> Post-Ride Reflection - Submit your time & tracking</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; vertical-align: top;">
                          <span style="font-size: 13px; color: #999999;"><strong style="color: #cccccc;">Step 17:</strong> Complete - Journey finished!</span>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-top: 16px; padding: 12px; background-color: rgba(255, 255, 255, 0.02); border-radius: 6px;">
                      <p style="margin: 0; font-size: 13px; color: #666666;">
                        ⚠️ <strong style="color: #FF6A00;">You must complete Step 16 (Post-Ride Reflection)</strong> after finishing your ride to show up on the leaderboard and earn completion points.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              ${!isSubscriber ? `
              <!-- Route File Access Notice -->
              <div style="background-color: rgba(255, 106, 0, 0.1); border: 2px solid #FF6A00; border-radius: 8px; padding: 24px; margin: 0 0 32px 0; text-align: center;">
                <div style="margin: 0 0 12px 0;">
                  <span style="font-size: 32px;">🗺️</span>
                </div>
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #FF6A00;">Need the Route File?</h3>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                  <strong style="color: #ffffff;">You're not currently a subscriber.</strong> To download the GPX route file for ${rideName}, you'll need a Gravalist subscription.
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #999999;">
                  Subscription includes unlimited GPX downloads for all current and future rides.
                </p>
                <a href="https://gravalist.com" style="display: inline-block; background-color: #FF6A00; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Upgrade to Download Routes
                </a>
              </div>
              ` : `
              <!-- Subscriber Route Access -->
              <div style="background-color: rgba(255, 106, 0, 0.05); border: 1px solid #FF6A00; border-radius: 8px; padding: 20px; margin: 0 0 32px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 24px; margin-right: 12px;">🗺️</span>
                  <h3 style="margin: 0; font-size: 16px; color: #FF6A00;">Route File Access</h3>
                </div>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cccccc;">
                  As a subscriber, you can <strong style="color: #ffffff;">download the GPX route file</strong> for ${rideName} directly from your dashboard. Navigate with confidence using the official mapped route.
                </p>
              </div>
              `}

              <!-- Important Reminders -->
              <div style="background-color: #0f0f0f; border: 1px solid #2a2a2a; border-radius: 6px; padding: 20px; margin: 0 0 32px 0;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #ffffff;">Important Reminders</h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <span style="color: #FF6A00; font-size: 16px; margin-right: 12px;">⚠️</span>
                      <span style="font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">No Official Support:</strong> This is a self-managed ride. You're responsible for your own safety, navigation, and logistics.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <span style="color: #FF6A00; font-size: 16px; margin-right: 12px;">📍</span>
                      <span style="font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">My Tracking, My Responsibility:</strong> You must track your own ride and provide proof of completion.</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <span style="color: #FF6A00; font-size: 16px; margin-right: 12px;">🏆</span>
                      <span style="font-size: 14px; color: #cccccc;"><strong style="color: #ffffff;">Points & Leaderboard:</strong> Complete all phases to earn points and climb the global leaderboard.</span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="https://gravalist.com/ride/${rideId}" style="display: inline-block; background-color: #FF6A00; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Complete Your Registration
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; text-align: center; color: #666666;">
                Click above to return to the app and finish your registration for ${rideName}
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666666;">
                My tracking, my responsibility.
              </p>
              <p style="margin: 0; font-size: 12px; color: #444444;">
                Questions? Visit <a href="https://gravalist.com" style="color: #FF6A00; text-decoration: none;">gravalist.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
REGISTRATION CONFIRMED: ${rideName}
${rideDate}

Hey ${displayName}, breathe. You've got this.

You've begun your registration for ${rideName}. This is a self-managed ultra ride—no official support, no organizers, just you taking full ownership of your adventure.

WHAT HAPPENS NEXT
Complete the 18-step registration journey across 3 phases to be fully registered for ${rideName}. Start now at Step 1—no one is ahead of you. You're beginning from the start like everyone else.

═══════════════════════════════════════════════════

YOUR COMPLETE 18-STEP JOURNEY

PHASE 1: REGISTER (IN PROGRESS - STEPS 0-9)
Complete your registration to earn 100 points

Steps:
• Step 0: Email Address
→ Step 1: Welcome to ${rideName} (You are here)
• Step 2: About You - Basic information
• Step 3: Download Route ${!isSubscriber ? '(⚠️ Requires Subscription)' : '(✓ Available)'}
• Step 4: Equipment Checklist
• Step 5: Accept Terms & Safety Guidelines
• Step 6: Medical Insurance Proof
• Step 7: Community Support Agreement
• Step 8: Registration Almost Complete
• Step 9: Ready to Ride - Registration Complete!

✓ Earn 100 points when you complete Step 9

───────────────────────────────────────────────────

PHASE 2: START LINE (STEPS 10-14 - UNLOCKS ON ${rideDate})
Check in when you arrive to earn 200 points

Steps:
• Step 10: Start - Countdown begins
• Step 11: Starting Photo - Capture the moment
• Step 12: Pre-Ride Check - How are you feeling?
• Step 13: Ride Start - Official countdown
• Step 14: GO GO GO! - Your adventure begins

✓ Earn 200 points for showing up at the start line

───────────────────────────────────────────────────

PHASE 3: END (STEPS 15-17 - UNLOCKS AFTER YOU FINISH)
Complete your report to appear on the leaderboard

Steps:
• Step 15: Welcome Back! - You made it
• Step 16: Post-Ride Reflection - Submit your time & tracking
• Step 17: Complete - Journey finished!

⚠️ You must complete Step 16 (Post-Ride Reflection) after finishing your ride to show up on the leaderboard and earn completion points.

═══════════════════════════════════════════════════

${!isSubscriber ? `
🗺️ NEED THE ROUTE FILE?
You're not currently a subscriber. To download the GPX route file for ${rideName}, you'll need a Gravalist subscription.

Subscription includes unlimited GPX downloads for all current and future rides.

Upgrade to Download Routes: https://gravalist.com
` : `
🗺️ ROUTE FILE ACCESS
As a subscriber, you can download the GPX route file for ${rideName} directly from your dashboard. Navigate with confidence using the official mapped route.
`}

IMPORTANT REMINDERS:

⚠️ No Official Support: This is a self-managed ride. You're responsible for your own safety, navigation, and logistics.

📍 My Tracking, My Responsibility: You must track your own ride and provide proof of completion.

🏆 Points & Leaderboard: Complete all phases to earn points and climb the global leaderboard.

═══════════════════════════════════════════════════

Complete Your Registration: https://gravalist.com/ride/${rideId}

Click above to return to the app and finish your registration for ${rideName}

My tracking, my responsibility.
Questions? Visit gravalist.com
  `;

  return sendEmail({
    from: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [{ email: userEmail }],
    bcc: [{ email: '139710685@bcc.eu1.hubspot.com' }],
    subject: `Registration Started: ${rideName} - Complete Your Registration`,
    html,
    text
  });
}