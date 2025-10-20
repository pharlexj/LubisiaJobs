import nodemailer from 'nodemailer';

// Load environment variables for email service
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER || process.env.EMAIL_FROM || '';
const EMAIL_PASS = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

export async function sendEmail(recipients: string[], subject: string, message: string): Promise<{success: boolean; error?: string; sentCount?: number}> {
  try {
    // Check if email credentials are configured
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn('Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables.');
      return {
        success: false,
        error: 'Email service not configured. Please add EMAIL_USER and EMAIL_PASSWORD in Secrets.',
        sentCount: 0
      };
    }

    const transporter = nodemailer.createTransporter({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    // Verify connection configuration
    await transporter.verify();

    // Send email to all recipients
    const info = await transporter.sendMail({
      from: `"Trans Nzoia County PSB" <${EMAIL_FROM}>`,
      to: recipients.join(','),
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0d9488;">${subject}</h2>
          <div style="margin: 20px 0; line-height: 1.6;">
            ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated message from Trans Nzoia County Public Service Board.
          </p>
        </div>
      `,
    });

    console.log('Email sent successfully:', info.messageId);
    return {
      success: true,
      sentCount: recipients.length
    };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
      sentCount: 0
    };
  }
}
