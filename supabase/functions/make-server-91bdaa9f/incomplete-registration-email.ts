import { sendEmail } from './mailersend.tsx';

// Email sender configuration - use noreply@gravalist.com
const SENDER_EMAIL = Deno.env.get('MAILERSEND_SENDER_EMAIL') || 'noreply@gravalist.com';
const SENDER_NAME = 'Gravalist';

const LOGO_URL = 'https://gravalist.com/wp-content/uploads/2024/08/Gravalist-logo-white.png';

/**
 * Send an incomplete registration reminder email
 */
export async function sendIncompleteRegistrationReminder(
  userEmail: string,
  userName: string | undefined,
  rideName: string,
  rideDate: string,
  rideLocation: string,
  currentPhase: 'register' | 'start_line' | 'end',
  continueUrl: string
): Promise<{ success: boolean; error?: string }> {
  const displayName = userName || 'Rider';
  
  // Determine what phase they're in and what's next
  const phaseInfo = {
    register: {
      title: 'Registration Phase',
      description: 'Complete your registration and get ready for the ride',
      steps: [
        { title: 'Set Your Username', description: 'Choose how you\'ll appear on the leaderboard' },
        { title: 'Emergency Contact', description: 'Add your emergency contact information' },
        { title: 'Review Details', description: 'Confirm your registration details' }
      ],
      nextAction: 'Complete Registration',
      earnPoints: '100 points for completing registration'
    },
    start_line: {
      title: 'Start Line Phase',
      description: 'Check in on ride day to confirm you\'re starting',
      steps: [
        { title: 'Arrive at Start', description: 'Get to the start location on ride day' },
        { title: 'Take Starting Photo', description: 'Document your start with a photo' },
        { title: 'Confirm Start Time', description: 'Check in when you begin riding' }
      ],
      nextAction: 'Check In at Start Line',
      earnPoints: '200 points for starting your ride'
    },
    end: {
      title: 'End Phase',
      description: 'Submit your completion data and claim your achievement',
      steps: [
        { title: 'Enter Finish Time', description: 'Record when you completed the ride' },
        { title: 'Upload Tracking Data', description: 'Share your GPX file or tracker link' },
        { title: 'Proof of Completion', description: 'Submit your completion documentation' }
      ],
      nextAction: 'Submit Completion',
      earnPoints: 'Major completion points and leaderboard status'
    }
  };

  const phase = phaseInfo[currentPhase];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your ${rideName} Registration</title>
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
              
              <!-- Reminder Badge -->
              <div style="text-align: center; margin: 0 0 24px 0;">
                <span style="display: inline-block; background-color: rgba(255, 106, 0, 0.1); color: #FF6A00; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  ⏰ Action Required
                </span>
              </div>

              <!-- Title -->
              <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff;">
                ${rideName}
              </h2>

              <!-- Ride Details -->
              <p style="margin: 0 0 8px 0; font-size: 16px; text-align: center; color: #999999;">
                📅 ${rideDate}
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; text-align: center; color: #999999;">
                📍 ${rideLocation}
              </p>

              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                Hey ${displayName}, <strong style="color: #ffffff;">breathe. You've got this.</strong>
              </p>

              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #cccccc;">
                You started registering for <strong style="color: #ffffff;">${rideName}</strong>, but you haven't finished yet. We wanted to remind you what's waiting and help you complete your journey.
              </p>

              <!-- Current Phase Info -->
              <div style="background-color: rgba(255, 106, 0, 0.05); border-left: 3px solid #FF6A00; padding: 20px; margin: 0 0 32px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #FF6A00;">${phase.title}</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #cccccc;">
                  ${phase.description}
                </p>
              </div>

              <!-- Steps to Complete -->
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff; text-align: center;">What's Next</h3>

              ${phase.steps.map((step, index) => `
              <div style="margin: 0 0 16px 0;">
                <div style="background-color: #0f0f0f; border: 1px solid #1a1a1a; border-radius: 6px; padding: 16px;">
                  <div style="margin-bottom: 8px;">
                    <span style="display: inline-block; width: 28px; height: 28px; background-color: rgba(255, 106, 0, 0.2); color: #FF6A00; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; margin-right: 12px;">${index + 1}</span>
                    <span style="font-size: 16px; color: #ffffff; font-weight: 500;">${step.title}</span>
                  </div>
                  <p style="margin: 0; font-size: 14px; color: #999999; padding-left: 40px;">
                    ${step.description}
                  </p>
                </div>
              </div>
              `).join('')}

              <!-- Points Reminder -->
              <div style="background-color: rgba(255, 106, 0, 0.08); border: 1px solid rgba(255, 106, 0, 0.3); border-radius: 8px; padding: 20px; margin: 0 0 32px 0; text-align: center;">
                <p style="margin: 0; font-size: 15px; color: #cccccc;">
                  <strong style="color: #FF6A00;">⭐ Earn ${phase.earnPoints}</strong>
                </p>
              </div>

              <!-- The 3 Phases -->
              <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff; text-align: center;">The Complete Journey</h3>

              <div style="margin: 0 0 32px 0;">
                <!-- Phase 1: Register -->
                <div style="background-color: ${currentPhase === 'register' ? 'rgba(255, 106, 0, 0.1)' : '#0f0f0f'}; border: 1px solid ${currentPhase === 'register' ? '#FF6A00' : '#1a1a1a'}; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
                  <div style="margin-bottom: 8px;">
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: ${currentPhase === 'register' ? '#FF6A00' : 'rgba(255, 106, 0, 0.2)'}; color: ${currentPhase === 'register' ? '#000000' : '#FF6A00'}; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">1</span>
                    <span style="font-size: 16px; color: #ffffff; font-weight: 600;">Register Phase</span>
                    ${currentPhase === 'register' ? '<span style="margin-left: 8px; font-size: 13px; color: #FF6A00;">← You are here</span>' : ''}
                  </div>
                  <p style="margin: 0; font-size: 14px; color: #999999; padding-left: 44px;">
                    Complete your registration and prepare for the ride
                  </p>
                </div>

                <!-- Phase 2: Start Line -->
                <div style="background-color: ${currentPhase === 'start_line' ? 'rgba(255, 106, 0, 0.1)' : '#0f0f0f'}; border: 1px solid ${currentPhase === 'start_line' ? '#FF6A00' : '#1a1a1a'}; border-radius: 6px; padding: 16px; margin-bottom: 12px;">
                  <div style="margin-bottom: 8px;">
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: ${currentPhase === 'start_line' ? '#FF6A00' : 'rgba(255, 106, 0, 0.2)'}; color: ${currentPhase === 'start_line' ? '#000000' : '#FF6A00'}; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">2</span>
                    <span style="font-size: 16px; color: #ffffff; font-weight: 600;">Start Line</span>
                    ${currentPhase === 'start_line' ? '<span style="margin-left: 8px; font-size: 13px; color: #FF6A00;">← You are here</span>' : ''}
                  </div>
                  <p style="margin: 0; font-size: 14px; color: #999999; padding-left: 44px;">
                    Check in on ride day to confirm you're starting
                  </p>
                </div>

                <!-- Phase 3: End -->
                <div style="background-color: ${currentPhase === 'end' ? 'rgba(255, 106, 0, 0.1)' : '#0f0f0f'}; border: 1px solid ${currentPhase === 'end' ? '#FF6A00' : '#1a1a1a'}; border-radius: 6px; padding: 16px;">
                  <div style="margin-bottom: 8px;">
                    <span style="display: inline-block; width: 32px; height: 32px; background-color: ${currentPhase === 'end' ? '#FF6A00' : 'rgba(255, 106, 0, 0.2)'}; color: ${currentPhase === 'end' ? '#000000' : '#FF6A00'}; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">3</span>
                    <span style="font-size: 16px; color: #ffffff; font-weight: 600;">End</span>
                    ${currentPhase === 'end' ? '<span style="margin-left: 8px; font-size: 13px; color: #FF6A00;">← You are here</span>' : ''}
                  </div>
                  <p style="margin: 0; font-size: 14px; color: #999999; padding-left: 44px;">
                    Submit your completion data and claim your achievement
                  </p>
                </div>
              </div>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${continueUrl}" style="display: inline-block; background-color: #FF6A00; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      ${phase.nextAction}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer Note -->
              <p style="margin: 0; font-size: 13px; text-align: center; color: #666666;">
                Take your time. This is self-managed—complete it when you're ready.
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
${rideName}
${rideDate} • ${rideLocation}

Hey ${displayName}, breathe. You've got this.

You started registering for ${rideName}, but you haven't finished yet. We wanted to remind you what's waiting and help you complete your journey.

CURRENT PHASE: ${phase.title}
${phase.description}

WHAT'S NEXT:
${phase.steps.map((step, index) => `
${index + 1}. ${step.title}
   ${step.description}
`).join('')}

⭐ EARN: ${phase.earnPoints}

THE COMPLETE JOURNEY:

1. Register Phase ${currentPhase === 'register' ? '← You are here' : ''}
   Complete your registration and prepare for the ride

2. Start Line ${currentPhase === 'start_line' ? '← You are here' : ''}
   Check in on ride day to confirm you're starting

3. End ${currentPhase === 'end' ? '← You are here' : ''}
   Submit your completion data and claim your achievement

${phase.nextAction}: ${continueUrl}

Take your time. This is self-managed—complete it when you're ready.

My tracking, my responsibility.
  `;

  return sendEmail({
    from: {
      email: SENDER_EMAIL,
      name: SENDER_NAME
    },
    to: [{ email: userEmail }],
    bcc: [{ email: '139710685@bcc.eu1.hubspot.com' }],
    subject: `${rideName} - Complete Your ${phase.title}`,
    html,
    text
  });
}