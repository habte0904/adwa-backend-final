import asyncHandler from "express-async-handler";
import nodemailer from "nodemailer";

export const sendContactMail = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    host: process.env.EVT_SMTP_HOST, // mail.premaxet.com
    port: parseInt(process.env.EVT_SMTP_PORT || '587'), // Ensure it's a number
    secure: process.env.EVT_SMTP_SECURE === 'true', // Ensure it's a boolean
    auth: {
      user: process.env.EVT_SMTP_USER,
      pass: process.env.EVT_SMTP_PASS,
    },
    tls: {
      // Add these options
      // This is often needed for servers that don't have well-known CAs or have issues with their certs.
      // USE WITH CAUTION IN PRODUCTION: Setting rejectUnauthorized to false disables certificate validation,
      // making your connection vulnerable to man-in-the-middle attacks.
      rejectUnauthorized: false,
      // You can also try specifying a minimum TLS version if you suspect an old server:
      // minVersion: 'TLSv1.2', // Or 'TLSv1.1', 'TLSv1' depending on server
    },
  });

  try {
    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: subject,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    });

    res.status(200).json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("Nodemailer error:", err); // Log the full error object for more details
    res.status(500).json({ error: "Failed to send email." });
  }
});