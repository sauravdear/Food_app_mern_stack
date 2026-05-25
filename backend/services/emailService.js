import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('Email not configured — skipping send');
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'Food Redistribution'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  logger.info(`Email sent to ${to}: ${subject}`);
};

export const sendPasswordReset = async (email, resetUrl) => {
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a>
        <p style="color: #6b7280; margin-top: 16px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

export const sendExpirationAlert = async (email, storeName, items) => {
  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.foodItemName}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.SKU}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${i.daysLeft <= 1 ? '#dc2626' : '#d97706'}">${i.daysLeft <= 0 ? 'EXPIRED' : `${i.daysLeft} day(s)`}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.currentStock} units</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb">$${i.potentialLoss.toFixed(2)}</td>
      </tr>`
    )
    .join('');

  await sendEmail({
    to: email,
    subject: `[ALERT] ${items.length} Item(s) Expiring Soon — ${storeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Expiration Alert: ${storeName}</h2>
        <p>${items.length} item(s) are approaching expiration and require immediate attention.</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left">Item</th>
              <th style="padding:8px;text-align:left">SKU</th>
              <th style="padding:8px;text-align:left">Days Left</th>
              <th style="padding:8px;text-align:left">Stock</th>
              <th style="padding:8px;text-align:left">Potential Loss</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="margin-top:16px;color:#6b7280;">Log in to the dashboard to view transfer recommendations.</p>
      </div>
    `,
  });
};

export const sendTransferNotification = async (email, transfer, type) => {
  const subjects = {
    created: `Transfer Request Created — ${transfer.transferId}`,
    approved: `Transfer Approved — ${transfer.transferId}`,
    completed: `Transfer Completed — ${transfer.transferId}`,
  };

  await sendEmail({
    to: email,
    subject: subjects[type] || `Transfer Update — ${transfer.transferId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Transfer ${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px;color:#6b7280">Transfer ID</td><td style="padding:6px;font-weight:bold">${transfer.transferId}</td></tr>
          <tr><td style="padding:6px;color:#6b7280">Item</td><td style="padding:6px">${transfer.foodItemName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280">Quantity</td><td style="padding:6px">${transfer.quantity}</td></tr>
          <tr><td style="padding:6px;color:#6b7280">From</td><td style="padding:6px">${transfer.sourceStoreName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280">To</td><td style="padding:6px">${transfer.destinationStoreName}</td></tr>
          <tr><td style="padding:6px;color:#6b7280">Status</td><td style="padding:6px">${transfer.status}</td></tr>
        </table>
      </div>
    `,
  });
};
