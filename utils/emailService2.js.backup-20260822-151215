
import nodemailer from "nodemailer";
/**
 * Send email with attachments
 * @param {string} recipient
 * @param {Buffer[]} attachments
 */
async function sendTicketEmail(recipient, attachments) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EVT_SMTP_USER,
      pass: process.env.EVT_SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"Adwa Victory Memorial" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: "Your Tickets for Adwa Victory Memorial",
    text: "Thanks for your purchase. Your tickets are attached as PDF.",
    attachments: attachments.map((buffer, index) => ({
      filename: `ticket_${index + 1}.pdf`,
      content: buffer,
      contentType: "application/pdf"
    }))
  };

  await transporter.sendMail(mailOptions);
}

export { sendTicketEmail };

