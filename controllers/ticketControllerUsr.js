// ES6 version
import PDFDocument from 'pdfkit'

import { buffer } from 'get-stream';
import moment from 'moment';
import ticketService from '../services/ticket.service.js';
import { generateTicketPDF } from '../utils/pdfGenerator.js';
import { sendTicketEmail } from '../utils/emailService2.js';
import * as bookingService from '../services/booking.service.js'
import archiver from 'archiver'
import { logActivity } from '../services/activityLog.service.js';

// CREATE
export const createTicketType = async (req, res) => {
  const ticket = req.body;
  // Prepare log fields
  const userId = req.user?.user_id || null;
  const userName = req.user?.username || 'Unknown';
  const role = req.user?.roleName || 'Unknown';
  const department = req.user?.department || 'Unknown';
  const action = 'Add Ticket Type';
  const details = JSON.stringify({
    type: ticket.type,
    description: ticket.description,
    price: ticket.price,
    feature: ticket.feature,
    daily_limit: ticket.daily_limit,
    status: ticket.status
  });
  try {
    // Check for duplicate type name (case-insensitive, trimmed)
    const existing = await ticketService.getAllTicketTypes();
    const normalizedType = ticket.type.trim().toLowerCase();
    const duplicate = existing.some(t => t.type && t.type.trim().toLowerCase() === normalizedType);
    if (duplicate) {
      logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
      return res.status(400).json({ message: 'A ticket type with this name already exists.' });
    }
    const result = await ticketService.createTicketType(ticket);
    logActivity({ userId, userName, role, department, action: action + ' (Success)', details });
    res.status(201).json({ message: 'Ticket type created successfully', ticket_id: result.insertId });
  } catch (error) {
    logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
    res.status(500).json({ message: 'Failed to create ticket type', error: error.message });
  }
};

// READ
export const getTicketTypes = async (req, res) => {
  try {

    const tickets = await ticketService.getAllTicketTypes();
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ticket types', error: error.message });
  }
};


// READ
export const getTicketTypesFront = async (req, res) => {
  try {

    const tickets = await ticketService.getTicketTypesFront();
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ticket types', error: error.message });
  }
};

// UPDATE
export const updateTicketType = async (req, res) => {
  const ticketId = req.params.id;
  const updatedData = req.body;
  // Prepare log fields
  const userId = req.user?.user_id || null;
  const userName = req.user?.username || 'Unknown';
  const role = req.user?.roleName || 'Unknown';
  const department = req.user?.department || 'Unknown';
  const action = 'Edit Ticket Type';
  const details = JSON.stringify({
    ticket_id: ticketId,
    type: updatedData.type,
    description: updatedData.description,
    price: updatedData.price,
    feature: updatedData.feature,
    daily_limit: updatedData.daily_limit,
    status: updatedData.status
  });
  try {
    // Check for duplicate type name (case-insensitive, trimmed, exclude self)
    const existing = await ticketService.getAllTicketTypes();
    const normalizedType = updatedData.type.trim().toLowerCase();
    const duplicate = existing.some(t => t.type && t.type.trim().toLowerCase() === normalizedType && String(t.ticket_id) !== String(ticketId));
    if (duplicate) {
      logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
      return res.status(400).json({ message: 'A ticket type with this name already exists.' });
    }
    const result = await ticketService.updateTicketType(ticketId, updatedData);
    if (result.affectedRows === 0) {
      logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
      return res.status(404).json({ message: 'Ticket type not found' });
    }
    logActivity({ userId, userName, role, department, action: action + ' (Success)', details });
    res.status(200).json({ message: 'Ticket type updated successfully' });
  } catch (error) {
    logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
    res.status(500).json({ message: 'Failed to update ticket type', error: error.message });
  }
};

// DELETE
export const deleteTicketType = async (req, res) => {
  const ticketId = req.params.id;
  // Prepare log fields
  const userId = req.user?.user_id || null;
  const userName = req.user?.username || 'Unknown';
  const role = req.user?.roleName || 'Unknown';
  const department = req.user?.department || 'Unknown';
  const action = 'Delete Ticket Type';
  const details = JSON.stringify({ ticket_id: ticketId });
  try {
    const result = await ticketService.deleteTicketType(ticketId);
    if (result.affectedRows === 0) {
      logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
      return res.status(404).json({ message: 'Ticket type not found' });
    }
    logActivity({ userId, userName, role, department, action: action + ' (Success)', details });
    res.status(200).json({ message: 'Ticket type deleted successfully' });
  } catch (error) {
    logActivity({ userId, userName, role, department, action: action + ' (Failed)', details });
    res.status(500).json({ message: 'Failed to delete ticket type', error: error.message });
  }
};

// Test DB
export const testDbConnection = async () => {
  try {
    return await ticketService.testDbConnection();
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Create Order
export const createOrderAndTickets = async (req, res) => {
  try {
    const userId = 16; // Replace with req.user.id when auth is added
    const { tickets, payment_reference, services } = req.body;
    const result = await ticketService.createOrderAndTickets(userId, tickets, payment_reference, services);
    res.status(201).json({ message: 'Order created', data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

// Get User Orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await ticketService.getUserOrders(userId);
    res.status(200).json({ message: 'Orders retrieved', data: orders });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// Get My Tickets
export const getMyTickets = async (req, res) => {

  const email = req.user.email;
  try {
    const tickets = await ticketService.getAllUserTickets(email);
    res.status(200).json({ message: 'Tickets fetched', data: tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get Order Details
export const getOrderDetails = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const orderDetails = await ticketService.getOrderDetails(orderId);
    if (!orderDetails) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ message: 'Order details retrieved successfully', data: orderDetails });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get All Services
export const getAllServices = async (req, res) => {
  try {
    const serviceData = await ticketService.getAllServices(req.body);
    res.status(200).json(serviceData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ticket types', error: error.message });
  }
};



// Email Ticket
export const emailTicket = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await ticketService.getOrderDetails(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Use the exported generator from utils (normalize data inside generator)
    const pdfBuffer = await generateTicketPDF(order);

    await sendTicketEmail({
      to: order.user_email || 'finotmahy@gmail.com',
      subject: 'Your Adwa Museum Ticket 🎫',
      text: 'Please find your ticket attached.',
      html: `<p>Dear visitor,</p><p>Here is your ticket. Show it at the entrance.</p>`,
      attachmentBuffer: pdfBuffer,
      filename: `Ticket_${orderId}.pdf`
    });

    res.json({ message: 'Ticket sent via email' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
};









/**
 * @param {Object} req - Express request object (contains params.chapa_tx_ref)
 * @param {Object} res - Express response object (to stream the PDF)
 * @returns {Promise<void>}
 */

export async function downloadTicketPDF(req, res) {
  try {
    const chapa_tx_ref = req.params.chapa_tx_ref;
    // Assuming bookingService is imported or available in scope
    const orderDetails = await bookingService.getBookingDetails(chapa_tx_ref);

    if (!orderDetails || !orderDetails.tickets || orderDetails.tickets.length === 0) {
      return res.status(404).json({ message: "Order or tickets not found" });
    }

    const { tickets, email, visit_date, services, ticket_booking_id } = orderDetails;

    // Set headers for PDF download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Adwa_Museum_Tickets_${chapa_tx_ref}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      autoFirstPage: false // We add pages manually in the loop
    });
    doc.pipe(res);

    // --- Museum / Professional Palette ---
    // Strictly following the requested design colors
    const COLORS = {
      BG_PAPER: "#FDFBF7",       // Warmer, premium paper tone
      ACCENT_GOLD: "#C5A059",    // Muted, elegant gold
      TEXT_PRIMARY: "#2C2C2C",   // Soft black for readability
      TEXT_SECONDARY: "#5a5a5a", // Grey for labels
      DIVIDER: "#E0E0E0",
      VALID: "#2F855A",
      INVALID: "#C53030",
    };

    const formattedDate = visit_date ? moment(visit_date).format("MMM DD, YYYY") : "N/A";

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      doc.addPage();

      // 1. Full Page Background (Paper Texture color)
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.BG_PAPER);

      // --- TICKET CARD GEOMETRY ---
      const cardWidth = 500;
      const cardHeight = 260;
      const cardX = (doc.page.width - cardWidth) / 2;
      const cardY = (doc.page.height - cardHeight) / 2 - 20;
      const cornerRadius = 8;

      // 2. Drop Shadow (Soft & Diffused)
      doc.save();
      doc.roundedRect(cardX + 5, cardY + 5, cardWidth, cardHeight, cornerRadius)
        .fillColor("black")
        .fillOpacity(0.08)
        .fill();
      doc.restore();

      // 3. Main Card Background
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, cornerRadius)
        .fillColor("white")
        .fill();

      // 4. Main Border
      doc.save();
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, cornerRadius)
        .lineWidth(1.5)
        .strokeColor(COLORS.ACCENT_GOLD)
        .stroke();
      doc.restore();

      // 5. Top Accent Border (Gold Header Block - Custom Path)
      doc.save();
      doc.path(`M ${cardX + cornerRadius} ${cardY} L ${cardX + cardWidth - cornerRadius} ${cardY} Q ${cardX + cardWidth} ${cardY} ${cardX + cardWidth} ${cardY + cornerRadius} L ${cardX + cardWidth} ${cardY + 6} L ${cardX} ${cardY + 6} L ${cardX} ${cardY + cornerRadius} Q ${cardX} ${cardY} ${cardX + cornerRadius} ${cardY}`)
        .fillColor(COLORS.ACCENT_GOLD)
        .fill();
      doc.restore();

      // --- LAYOUT CONSTANTS ---
      const splitX = cardX + 340; // The "tear line"
      const contentPadding = 25;
      const leftColX = cardX + contentPadding;

      // 6. PERFORATION LINE (Dashed Divider)
      doc.save();
      doc.moveTo(splitX, cardY)
        .lineTo(splitX, cardY + cardHeight)
        .dash(4, { space: 4 })
        .strokeColor(COLORS.DIVIDER)
        .lineWidth(1)
        .stroke();
      doc.restore();

      // --- LEFT SIDE: MAIN INFO ---
      let currentY = cardY + 35;

      // Museum Label
      doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.ACCENT_GOLD)
        .text("OFFICIAL MUSEUM PASS", leftColX, currentY);

      currentY += 15;

      // Main Title
      doc.font("Times-Bold").fontSize(20).fillColor(COLORS.TEXT_PRIMARY)
        .text("ADWA VICTORY MEMORIAL", leftColX, currentY, { width: 300, lineGap: 5 });

      // FIX: Use dynamic height based on text wrapping instead of fixed += 35
      // This ensures if title wraps to 2+ lines, the grid below moves down accordingly
      currentY = doc.y + 15;

      // Info Grid Setup
      const labelSize = 7;
      const valueSize = 11;
      const gridStartY = currentY;

      // ROW 1: Date of Visit (removed OPENING HOURS)
      doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY)
        .text("DATE OF VISIT", leftColX, gridStartY);

      doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
        .text(formattedDate, leftColX, gridStartY + 12);

      // ROW 2: Ticket Type (removed LOCATION)
      const row2Y = gridStartY + 45;
      doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY)
        .text("TICKET TYPE", leftColX, row2Y);

      // Determine Ticket Type Text
      let typeText = "General Entry";
      if (ticket.ticketTypes && ticket.ticketTypes.length > 0) {
        typeText = ticket.ticketTypes.map(t => `${t.type} (x${t.quantity})`).join(", ");
      } else {
        typeText = `${ticket.type || "Standard"} (x${ticket.quantity || 1})`;
      }

      doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
        .text(typeText, leftColX, row2Y + 12, { width: 280, ellipsis: true });

      // ROW 3: Holder Email
      const row3Y = row2Y + 45;
      doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY)
        .text("TICKET HOLDER", leftColX, row3Y);

      doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
        .text(email || "Guest", leftColX, row3Y + 12, { width: 280, ellipsis: true });

      // --- RIGHT SIDE: STUB & QR ---
      const stubWidth = cardWidth - (splitX - cardX);
      const stubCenter = splitX + (stubWidth / 2);
      let stubY = cardY + 35;

      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.TEXT_PRIMARY)
        .text("ADMIT ONE", splitX, stubY, { width: stubWidth, align: "center" });

      stubY += 25;

      // QR Code Container
      const qrSize = 90;
      const qrBoxX = stubCenter - (qrSize / 2);

      // QR Border
      doc.rect(qrBoxX - 4, stubY - 4, qrSize + 8, qrSize + 8)
        .strokeColor(COLORS.ACCENT_GOLD).lineWidth(1).stroke();

      if (ticket.qr_code) {
        try {
          const base64Image = ticket.qr_code.startsWith("data:image/") ? ticket.qr_code.split(",")[1] : ticket.qr_code;
          const qrBuffer = Buffer.from(base64Image, "base64");
          doc.image(qrBuffer, qrBoxX, stubY, { width: qrSize, height: qrSize });
        } catch (e) {
          doc.fontSize(8).fillColor(COLORS.INVALID).text("QR Err", qrBoxX, stubY + 40, { align: 'center', width: qrSize });
        }
      }

      stubY += qrSize + 15;

      // Ticket ID
      doc.font("Courier").fontSize(8).fillColor(COLORS.TEXT_SECONDARY)
        .text(ticket.type_id || ticket_booking_id || "ID: ####", splitX, stubY, { width: stubWidth, align: "center" });

      stubY += 20;

      // Status Badge (Pill shape)
      const normalizedStatus = (ticket.status || "VALID").toString().trim().toLowerCase();
      const effectiveStatus = normalizedStatus || "valid";
      const statusColor = effectiveStatus === "valid" ? COLORS.VALID : COLORS.INVALID;

      const pillWidth = 60;
      const pillHeight = 16;
      const pillX = stubCenter - (pillWidth / 2);

      doc.roundedRect(pillX, stubY, pillWidth, pillHeight, 8)
        .fillColor(statusColor).fillOpacity(0.1).fill();

      doc.font("Helvetica-Bold").fontSize(7).fillColor(statusColor).fillOpacity(1)
        .text(effectiveStatus.toUpperCase(), pillX, stubY + 4, { width: pillWidth, align: "center" });

      // --- FOOTER ---
      const footerY = cardY + cardHeight - 25;

      doc.moveTo(cardX + 10, footerY).lineTo(cardX + cardWidth - 10, footerY)
        .strokeColor(COLORS.ACCENT_GOLD).lineWidth(1).stroke();

      doc.font("Times-Italic").fontSize(7).fillColor(COLORS.TEXT_SECONDARY)
        .text("Authorized by Adwa Museum. Present this ticket at the entrance.", cardX, footerY + 8, { width: cardWidth, align: "center" });
    }

    // --- Optional: Services Page ---
    if (services && services.length > 0) {
      doc.addPage();
      // Keep background consistent
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.BG_PAPER);

      const receiptWidth = 400;
      const receiptX = (doc.page.width - receiptWidth) / 2;
      let receiptY = 100;

      doc.font("Times-Bold").fontSize(18).fillColor(COLORS.TEXT_PRIMARY)
        .text("ADDITIONAL SERVICES RECEIPT", 0, receiptY, { align: "center" });

      receiptY += 40;
      doc.moveTo(receiptX, receiptY).lineTo(receiptX + receiptWidth, receiptY)
        .lineWidth(1.5).strokeColor(COLORS.ACCENT_GOLD).stroke();

      receiptY += 20;

      services.forEach(s => {
        // Service Name
        doc.fontSize(12).font("Times-Roman").fillColor(COLORS.TEXT_PRIMARY)
          .text(s.name, receiptX, receiptY);

        // Qty
        doc.text(`x${s.quantity}`, receiptX + 250, receiptY);

        // Price
        doc.text(`${s.subtotal} ETB`, receiptX + 350, receiptY, { align: "right", width: 50 });

        receiptY += 30;

        // Light divider
        doc.moveTo(receiptX, receiptY - 10).lineTo(receiptX + receiptWidth, receiptY - 10)
          .dash(2, { space: 2 }).lineWidth(0.5).strokeColor(COLORS.DIVIDER).stroke();
        doc.undash();
      });
    }

    doc.end();

  } catch (error) {
    console.error("PDF generation failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "PDF generation failed", error: error.message });
    }
  }
}
