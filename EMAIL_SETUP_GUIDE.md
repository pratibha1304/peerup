# 📧 Email Notification Setup Guide

## Overview

PeerUP now sends email notifications for all important events:
- ✅ New match requests
- ✅ Match request accepted/declined
- ✅ New messages
- ✅ Incoming calls
- ✅ Schedule requests
- ✅ Schedule confirmed/declined

## Setup Instructions

### 1. Gmail App Password Setup

Since we're using `peerup152@gmail.com` to send emails, you need to set up a Gmail App Password:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "PeerUP Email Service"
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
EMAIL_USER=peerup152@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production, use your actual domain:
# NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

**Important**: 
- Use the **App Password**, not your regular Gmail password
- Remove spaces from the App Password when adding to `.env.local`
- Never commit `.env.local` to git (it's already in `.gitignore`)

### 3. Test Email Service

After setting up, restart your dev server:

```bash
npm run dev
```

The email service will automatically verify the connection on startup. Check your console for:
- ✅ `Email service is ready to send emails` (success)
- ❌ `Email service error: ...` (if there's an issue)

### 4. Email Templates

All email templates are located in `lib/email.ts`. They include:
- Beautiful HTML templates with PeerUP branding
- Responsive design
- Action buttons linking back to the app
- Professional styling

### 5. How It Works

When events occur:
1. The function (e.g., `sendMessage`, `sendMatchRequest`) triggers
2. User data is fetched from Firestore
3. Email API is called with the event type and user data
4. Email is sent asynchronously (won't block the main operation)
5. Errors are logged but don't break the app

### 6. Production Setup

For production deployment:

1. **Add environment variables** to your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Other platforms: Check their documentation

2. **Update `NEXT_PUBLIC_APP_URL`** to your production domain

3. **Test** by triggering an event and checking the recipient's inbox

### 7. Troubleshooting

**Emails not sending?**
- Check that `EMAIL_PASSWORD` is set correctly (App Password, not regular password)
- Verify Gmail account has 2-Step Verification enabled
- Check server logs for error messages
- Ensure `.env.local` is in the project root

**Emails going to spam?**
- This is normal for new email services
- Consider setting up SPF/DKIM records for your domain (advanced)
- Ask users to mark emails as "Not Spam"

**Rate limiting?**
- Gmail has limits: 500 emails/day for free accounts
- For higher volume, consider using a service like SendGrid or Resend

### 8. Customization

To customize email templates:
1. Edit `lib/email.ts`
2. Modify the `emailTemplates` object
3. Update HTML/CSS as needed
4. Test by triggering the event

### 9. Security Notes

- ✅ App Passwords are secure and can be revoked anytime
- ✅ Environment variables are never exposed to the client
- ✅ Email service runs server-side only
- ✅ Failed emails don't break the app functionality

---

**Need Help?**
- Check the console logs for detailed error messages
- Verify all environment variables are set correctly
- Ensure the Gmail account is accessible

