
import QRCode from 'qrcode';
/**
 * Generate a QR Code Data URL for a ticket
 * @param {string} type_id
 * @param {string} email
 * @param {string} ticket_booking_id
 * @param {string} visit_date
 * @returns {Promise<string>}
 */
async function generateTicketQR(type_id, email, ticket_booking_id, visit_date) {
   const qrPayload = type_id
   //JSON.stringify({
  //   ,
  //   email,
  //   ticket_booking_id,
  //   visit_date
  // });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrPayload);
    return qrDataUrl;
  } catch (err) {
    console.error('QR generation failed:', err);
    throw err;
  }
}

export { generateTicketQR };
