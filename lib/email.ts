import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'peerup152@gmail.com',
    pass: process.env.EMAIL_PASSWORD || '', // Gmail App Password
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email service is ready to send emails');
  }
});

export type EmailType = 
  | 'match_request'
  | 'match_accepted'
  | 'match_declined'
  | 'new_message'
  | 'incoming_call'
  | 'schedule_request'
  | 'schedule_confirmed'
  | 'schedule_declined';

interface EmailData {
  to: string;
  toName: string;
  fromName?: string;
  message?: string;
  matchName?: string;
  callerName?: string;
  scheduleTime?: string;
  actionUrl?: string;
}

// Email templates
const emailTemplates = {
  match_request: (data: EmailData) => ({
    subject: `New Match Request from ${data.fromName || 'Someone'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #CBD83B 0%, #A88AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #A88AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Match Request!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p><strong>${data.fromName || 'Someone'}</strong> wants to connect with you on PeerUP!</p>
              <p>Check out their profile and respond to their request.</p>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/match/requests'}" class="button">View Request</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  match_accepted: (data: EmailData) => ({
    subject: `🎉 ${data.fromName || 'Someone'} Accepted Your Match Request!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #CBD83B 0%, #A88AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #CBD83B; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Match Accepted!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p>Great news! <strong>${data.fromName || 'Someone'}</strong> has accepted your match request!</p>
              <p>You're now connected. Start chatting and working together on your goals.</p>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/match/mutual'}" class="button">View Match</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  match_declined: (data: EmailData) => ({
    subject: `Match Request Update`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f0f0f0; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Match Request Update</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p>We wanted to let you know that <strong>${data.fromName || 'Someone'}</strong> has declined your match request.</p>
              <p>Don't worry! There are plenty of other great matches waiting for you.</p>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/match'}" class="button">Find More Matches</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  new_message: (data: EmailData) => ({
    subject: `💬 New Message from ${data.fromName || 'Someone'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #CBD83B 0%, #A88AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .message-box { background: white; padding: 20px; border-left: 4px solid #A88AED; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #A88AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💬 New Message</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p><strong>${data.fromName || 'Someone'}</strong> sent you a message:</p>
              <div class="message-box">
                <p>"${data.message || 'Check your PeerUP inbox for the full message.'}"</p>
              </div>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/chats'}" class="button">Reply Now</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  incoming_call: (data: EmailData) => ({
    subject: `📞 Incoming Call from ${data.callerName || 'Someone'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #CBD83B 0%, #A88AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #CBD83B; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📞 Incoming Call</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p><strong>${data.callerName || 'Someone'}</strong> is calling you on PeerUP!</p>
              <p>If you missed the call, you can call them back or send them a message.</p>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/chats'}" class="button">View Chat</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  schedule_request: (data: EmailData) => ({
    subject: `📅 Schedule Request from ${data.fromName || 'Someone'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #CBD83B 0%, #A88AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #A88AED; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Schedule Request</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p><strong>${data.fromName || 'Someone'}</strong> has sent you a schedule request.</p>
              <p>Proposed times: ${data.scheduleTime || 'Check the app for details'}</p>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/schedule'}" class="button">View Request</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  schedule_confirmed: (data: EmailData) => ({
    subject: `✅ Schedule Confirmed with ${data.fromName || 'Someone'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #CBD83B 0%, #A88AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .time-box { background: white; padding: 20px; border-left: 4px solid #CBD83B; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #CBD83B; color: #333; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Schedule Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p>Great! Your schedule with <strong>${data.fromName || 'Someone'}</strong> has been confirmed.</p>
              <div class="time-box">
                <p><strong>Scheduled Time:</strong></p>
                <p>${data.scheduleTime || 'Check the app for details'}</p>
              </div>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/schedule'}" class="button">View Schedule</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  schedule_declined: (data: EmailData) => ({
    subject: `Schedule Request Update`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f0f0f0; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Schedule Request Update</h1>
            </div>
            <div class="content">
              <p>Hi ${data.toName},</p>
              <p><strong>${data.fromName || 'Someone'}</strong> has declined your schedule request.</p>
              <p>You can propose a different time or find another match.</p>
              <a href="${data.actionUrl || 'https://your-app-url.com/dashboard/schedule'}" class="button">View Schedules</a>
              <p class="footer">This is an automated email from PeerUP. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Send email function
export async function sendEmail(
  type: EmailType,
  data: EmailData
): Promise<void> {
  try {
    const template = emailTemplates[type](data);
    
    const mailOptions = {
      from: `"PeerUP" <${emailConfig.auth.user}>`,
      to: data.to,
      subject: template.subject,
      html: template.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${data.to} for ${type}`);
  } catch (error) {
    console.error(`Error sending email to ${data.to} for ${type}:`, error);
    // Don't throw error - email failures shouldn't break the app
  }
}

