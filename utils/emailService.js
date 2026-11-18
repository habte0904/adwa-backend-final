
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EVT_SMTP_HOST,
  port: process.env.EVT_SMTP_PORT,
  secure: process.env.EVT_SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EVT_SMTP_USER,
    pass: process.env.EVT_SMTP_PASS,
  },
});

export const sendUserCredentialsEmail = async (to, name, username, tempPassword) => {
  try {
     transporter.sendMail({
      from: 'Adwa Victory Memorial Admin <onboarding@yourmuseum.com>', 
      to,
      subject: 'Your Adwa Victory Memorial Account Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #F59E0B;">Welcome to Adwa Victory Memorial Portal, ${name}!</h2>
          <p>We’re excited to have you on board. Below are your login credentials:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p><strong>Please log in and change your password immediately for security purposes.</strong></p>
          
          <p style="margin-top: 40px;">Best regards,<br/>The Museum IT Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send credentials email:', error);
  }
};