# Gravalist Branded Password Reset Email

To ensure your password reset emails perfectly match the dark, premium aesthetic of your Gravalist frontend, please copy and paste the following HTML template directly into your **Supabase Dashboard**.

## Instructions for Supabase

1. Go to your Supabase project dashboard: [Project Authentication Settings](https://supabase.com/dashboard/project/_/auth/templates)
2. In the left sidebar, navigate to **Authentication** > **Email Templates**.
3. Select the **Reset Password** tab.
4. Replace the existing content in the **Message body (HTML)** field with the code block below.
5. *(Optional)* Set the **Subject** line to: `Reset your Gravalist password`
6. Click **Save**.

---

### HTML Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      background-color: #000000;
      color: #ededed;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #000000;
      padding: 40px 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
      background-color: #111111;
      border: 1px solid #333333;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      padding: 30px 40px 20px;
      text-align: center;
      border-bottom: 1px solid #222222;
    }
    .header h1 {
      margin: 0;
      color: #ff6a00;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .content {
      padding: 30px 40px;
      text-align: left;
    }
    .content h2 {
      margin-top: 0;
      color: #ededed;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .content p {
      font-size: 15px;
      line-height: 1.6;
      color: #a0a0a0;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #ff6a00;
      color: #ffffff;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      transition: opacity 0.2s;
    }
    .footer {
      padding: 20px 40px;
      text-align: center;
      background-color: #0a0a0a;
      border-top: 1px solid #222222;
    }
    .footer p {
      margin: 0;
      font-size: 13px;
      color: #666666;
    }
    .footer a {
      color: #ff6a00;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://gravalist.com/gravalist_orange-white.png" alt="Gravalist" width="180" style="display: block; margin: 0 auto; height: auto;">
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for the Gravalist account associated with this email address. If you made this request, please click the button below to choose a new password.</p>
        
        <div class="button-container">
          <!-- Supabase dynamically replaces {{ .ConfirmationURL }} -->
          <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
        </div>
        
        <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p>Best,<br>The Gravalist Team</p>
      </div>
      <div class="footer">
        <p>© 2026 Gravalist. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
```
