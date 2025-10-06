import nodemailer from 'nodemailer';

// Load environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = Number(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.GOOGLE_CLIENT || process.env.FB_CLIENT || '';
const EMAIL_PASS = process.env.GOOGLE_SECRET || process.env.FB_SECRET || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

export async function sendEmail(recipients: string[], subject: string, message: string): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: recipients.join(','),
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
