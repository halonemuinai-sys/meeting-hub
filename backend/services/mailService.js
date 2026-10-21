const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { generateIcs } = require('./icsGenerator');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const mailMode = process.env.MAIL_MODE || 'log';
  if (mailMode === 'smtp' && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

function formatEnglishDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }) + ' WIB';
}

/**
 * Send Booking Confirmation Email with .ics Calendar Invite
 */
async function sendBookingConfirmation(booking, room, company, { isUpdate = false } = {}) {
  try {
    let rawAttendees = [];
    if (Array.isArray(booking.attendees)) {
      rawAttendees = booking.attendees;
    } else if (typeof booking.attendees === 'string' && booking.attendees.trim()) {
      try {
        rawAttendees = JSON.parse(booking.attendees);
      } catch (_) {
        rawAttendees = booking.attendees.split(/[,;\s]+/).filter(Boolean);
      }
    }
    const recipientEmails = Array.from(
      new Set([booking.organizerEmail, ...rawAttendees].filter(e => e && typeof e === 'string' && e.includes('@')).map(e => e.trim().toLowerCase()))
    );

    if (recipientEmails.length === 0) {
      console.log('No valid recipient emails found for booking notification.');
      return;
    }

    const companyObj = company || room?.company || { name: 'MRA Group' };
    // Updates reuse the same calendar UID; a higher SEQUENCE (seconds since epoch, always increasing)
    // makes Outlook / Google Calendar replace the existing event instead of adding a duplicate.
    const icsContent = generateIcs(booking, room, companyObj, recipientEmails, {
      sequence: isUpdate ? Math.floor(Date.now() / 1000) : 0
    });
    const dateFormatted = `${formatEnglishDate(booking.startTime)} - ${new Date(booking.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; color: #ffffff; text-align: left; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 28px 24px; }
        .field { margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
        .field:last-child { border-bottom: none; margin-bottom: 0; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #64748b; margin-bottom: 4px; }
        .val { font-size: 14px; font-weight: 600; color: #0f172a; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #eff6ff; color: #1d4ed8; }
        .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <p>MRA GROUP · MEETING ROOM BOOKING</p>
          <h1>${isUpdate ? 'Meeting Room Reservation Updated' : 'Meeting Room Reservation Confirmation'}</h1>
          <p>${isUpdate ? 'The organizer has updated this meeting. The details below replace the previous invitation.' : 'Your room booking has been successfully confirmed.'}</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Meeting Title & Agenda</div>
            <div class="val" style="font-size: 16px; color: #1d4ed8;">${booking.title}</div>
          </div>
          <div class="field">
            <div class="label">Date & Time</div>
            <div class="val">${dateFormatted}</div>
          </div>
          <div class="field">
            <div class="label">Room & Location</div>
            <div class="val">${room.name} ${room.floor ? `(${room.floor})` : ''} · <span class="badge">${company.name}</span></div>
          </div>
          <div class="field">
            <div class="label">Organizer (Host)</div>
            <div class="val">${booking.organizerName} (${booking.organizerEmail}) - ${booking.department}</div>
          </div>
          <div class="field">
            <div class="label">Number of Attendees</div>
            <div class="val">${booking.attendeesCount} People</div>
          </div>
          ${booking.description ? `
          <div class="field">
            <div class="label">Agenda Details</div>
            <div class="val" style="font-weight: 400; color: #334155;">${booking.description}</div>
          </div>` : ''}
          ${booking.specialRequests ? `
          <div class="field">
            <div class="label">Special Requests</div>
            <div class="val" style="color: #b45309; font-weight: 500;">${booking.specialRequests}</div>
          </div>` : ''}
        </div>
        <div class="footer">
          Standard iCalendar invitation (.ics) attached. Click "Add to Calendar" in your email app to sync with Microsoft Outlook or Google Calendar.<br/>
          &copy; ${new Date().getFullYear()} MRA Group. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'MRA Meeting Booking'}" <${process.env.SMTP_FROM || 'meeting@mra.co.id'}>`,
      to: recipientEmails.join(', '),
      subject: isUpdate
        ? `[UPDATED] Meeting Room Booking: ${booking.title} (${room.name})`
        : `[CONFIRMED] Meeting Room Booking: ${booking.title} (${room.name})`,
      html: htmlContent,
      icalEvent: {
        filename: 'invite.ics',
        method: 'REQUEST',
        content: icsContent
      },
      attachments: [
        {
          filename: 'invite.ics',
          content: icsContent,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST'
        }
      ]
    };

    const mailMode = process.env.MAIL_MODE || 'log';
    if (mailMode === 'smtp') {
      const client = getTransporter();
      if (client) {
        await client.sendMail(mailOptions);
        console.log(`[MAIL] Email sent successfully to: ${recipientEmails.join(', ')}`);
        return;
      }
    }

    const outboxDir = path.join(__dirname, '../mail-outbox');
    if (!fs.existsSync(outboxDir)) {
      fs.mkdirSync(outboxDir, { recursive: true });
    }
    const logFile = path.join(outboxDir, `booking-${booking.id}-${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify({
      to: recipientEmails,
      subject: mailOptions.subject,
      bookingId: booking.id,
      timestamp: new Date().toISOString(),
      ics: icsContent
    }, null, 2));

    console.log(`[MAIL MOCK] Booking confirmation logged to: ${logFile} (Recipients: ${recipientEmails.join(', ')})`);
  } catch (err) {
    console.error('[MAIL ERROR] Failed to send booking notification:', err);
  }
}

/**
 * Send Cancellation Email Notification
 */
async function sendBookingCancellation(booking, room, company, reason = '') {
  try {
    let rawAttendees = [];
    if (Array.isArray(booking.attendees)) {
      rawAttendees = booking.attendees;
    } else if (typeof booking.attendees === 'string' && booking.attendees.trim()) {
      try {
        rawAttendees = JSON.parse(booking.attendees);
      } catch (_) {
        rawAttendees = booking.attendees.split(/[,;\s]+/).filter(Boolean);
      }
    }
    const recipientEmails = Array.from(
      new Set([booking.organizerEmail, ...rawAttendees].filter(e => e && typeof e === 'string' && e.includes('@')).map(e => e.trim().toLowerCase()))
    );

    if (recipientEmails.length === 0) return;

    const companyName = company?.name || room?.company?.name || 'MRA Group';

    const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #dc2626;">[CANCELLED] Meeting Reservation: ${booking.title}</h2>
      <p>Notice: The following meeting room reservation has been cancelled:</p>
      <ul>
        <li><strong>Room:</strong> ${room.name} (${companyName})</li>
        <li><strong>Time:</strong> ${formatEnglishDate(booking.startTime)}</li>
        <li><strong>Organizer:</strong> ${booking.organizerName}</li>
        ${reason ? `<li><strong>Cancellation Reason:</strong> ${reason}</li>` : ''}
      </ul>
      <p style="color: #64748b; font-size: 12px;">MRA Group Meeting Room Booking System</p>
    </div>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'MRA Meeting Booking'}" <${process.env.SMTP_FROM || 'meeting@mra.co.id'}>`,
      to: recipientEmails.join(', '),
      subject: `[CANCELLED] Meeting Room Cancelled: ${booking.title}`,
      html: htmlContent
    };

    const mailMode = process.env.MAIL_MODE || 'log';
    if (mailMode === 'smtp') {
      const client = getTransporter();
      if (client) {
        await client.sendMail(mailOptions);
        console.log(`[MAIL] Cancellation email sent to: ${recipientEmails.join(', ')}`);
        return;
      }
    }

    console.log(`[MAIL MOCK] Cancellation email logged for: ${booking.id} (Recipients: ${recipientEmails.join(', ')})`);
  } catch (err) {
    console.error('[MAIL ERROR] Failed to send cancellation email:', err);
  }
}

/**
 * Send Password Reset Email with OTP Code & Direct Link
 */
async function sendPasswordResetEmail(user, code, resetLink = '') {
  try {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 15px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .text { font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .code-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #15803d; letter-spacing: 1px; margin-bottom: 6px; }
        .code-value { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #166534; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .btn-wrap { text-align: center; margin: 24px 0; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2); }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MRA Group Meeting Hub</h1>
          <p>Security & Authentication Service</p>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${user.name || 'MRA Team Member'}</div>
          <p class="text">
            We received a request to reset the password for your account associated with <strong>${user.email}</strong>. Use the 6-digit verification code below to authorize your password change.
          </p>

          <div class="code-box">
            <div class="code-label">Verification OTP Code</div>
            <div class="code-value">${code}</div>
            <p style="margin: 8px 0 0; font-size: 11px; color: #15803d;">This code is valid for 15 minutes.</p>
          </div>

          ${resetLink ? `
          <div class="btn-wrap">
            <a href="${resetLink}" class="btn" target="_blank">Reset Password Directly</a>
          </div>
          ` : ''}

          <p class="text" style="font-size: 11px; color: #64748b; margin-top: 24px;">
            If you did not initiate this request, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} MRA Group · Corporate IT & General Affairs · Wisma MRA
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'MRA Meeting Booking'}" <${process.env.SMTP_FROM || 'meeting@mra.co.id'}>`,
      to: user.email,
      subject: `[MRA Portal] Password Reset Verification Code: ${code}`,
      html: htmlContent
    };

    const mailMode = process.env.MAIL_MODE || 'log';
    if (mailMode === 'smtp') {
      const client = getTransporter();
      if (client) {
        await client.sendMail(mailOptions);
        console.log(`[MAIL] Password reset email sent to: ${user.email}`);
        return;
      }
    }

    console.log(`[MAIL MOCK] Password reset OTP for ${user.email}: ${code}`);
  } catch (err) {
    console.error('[MAIL ERROR] Failed to send password reset email:', err);
  }
}

module.exports = {
  sendBookingConfirmation,
  sendBookingCancellation,
  sendPasswordResetEmail,
  formatEnglishDate
};

