import PDFDocument from 'pdfkit';
import { buffer } from 'get-stream';
import moment from 'moment';
import { format } from "date-fns";

/**
 * Museum Palette & Constants
 */
const COLORS = {
  BG_CREAM: "#FCFBF4",
  BORDER_GOLD: "#c78408",
  TEXT_DARK: "#1A202C",
  TEXT_MUTED: "#272d38",
  VALID: "#2F855A",
  INVALID: "#C53030",
  WHITE: "#FFFFFF"
};

/**
 * Generates a PDF buffer for museum tickets (Single or Group)
 */
async function generateTicketPDF(ticketInfo) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    autoFirstPage: true
  });

  const pdfBufferPromise = buffer(doc);

  // --- Museum / Professional Palette ---
  const COLORS = {
    BG_PAPER: "#FDFBF7",       // Warmer, premium paper tone
    ACCENT_GOLD: "#C5A059",    // Muted, elegant gold
    TEXT_PRIMARY: "#2C2C2C",   // Soft black for readability
    TEXT_SECONDARY: "#5a5a5a", // Grey for labels
    DIVIDER: "#E0E0E0",
    VALID: "#2F855A",
    INVALID: "#C53030",
  };

  // 1. Full Page Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.BG_PAPER);

  // --- TICKET CARD GEOMETRY ---
  const cardWidth = 500;
  const cardHeight = 260; 
  const cardX = (doc.page.width - cardWidth) / 2;
  const cardY = (doc.page.height - cardHeight) / 2 - 20;
  const cornerRadius = 8;

  // 2. Drop Shadow
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
  
  // 5. Top Accent Border (Gold Header Block)
  doc.save();
  doc.path(`M ${cardX+cornerRadius} ${cardY} L ${cardX+cardWidth-cornerRadius} ${cardY} Q ${cardX+cardWidth} ${cardY} ${cardX+cardWidth} ${cardY+cornerRadius} L ${cardX+cardWidth} ${cardY+6} L ${cardX} ${cardY+6} L ${cardX} ${cardY+cornerRadius} Q ${cardX} ${cardY} ${cardX+cornerRadius} ${cardY}`)
      .fillColor(COLORS.ACCENT_GOLD)
      .fill();
  doc.restore();

  // --- LAYOUT CONSTANTS ---
  const splitX = cardX + 340; // The "tear line"
  const contentPadding = 25;
  const leftColX = cardX + contentPadding;

  // 6. PERFORATION LINE
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

  currentY = doc.y + 15; 

  // Info Grid Setup
  const labelSize = 7;
  const valueSize = 11;
  const gridStartY = currentY;

  // ROW 1: Date of Visit
  const formattedDate = moment(ticketInfo.visit_date).format("MMM DD, YYYY");
  doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY)
      .text("DATE OF VISIT", leftColX, gridStartY);
  doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
      .text(formattedDate || "N/A", leftColX, gridStartY + 12);

  // ROW 2: Ticket Type
  const row2Y = gridStartY + 45;
  doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY)
      .text(ticketInfo.group ? "GROUP DETAILS" : "TICKET TYPE", leftColX, row2Y);
  
  let typeText = "General Entry";
  if (ticketInfo.group) {
      typeText = ticketInfo.ticketTypes?.map(t => `${t.type} (x${t.quantity})`).join(", ") || "Group Entry";
  } else {
      const qty = ticketInfo.quantity ?? ticketInfo.qty ?? 1;
      typeText = `${ticketInfo.type || "Standard"} (x${qty})`;
  }

  doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
      .text(typeText, leftColX, row2Y + 12, { width: 280, ellipsis: true });

  // ROW 3: Holder & ID
  const row3Y = row2Y + 45;
  doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY)
      .text("TICKET HOLDER", leftColX, row3Y);
  doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
      .text(ticketInfo.email || "Guest", leftColX, row3Y + 12, {width: 200, ellipsis: true});


  // --- RIGHT SIDE: STUB & QR ---
  const stubWidth = cardWidth - (splitX - cardX);
  const stubCenter = splitX + (stubWidth / 2);
  let stubY = cardY + 35;

  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.TEXT_PRIMARY)
      .text("ADMIT ONE", splitX, stubY, { width: stubWidth, align: "center" });

  stubY += 25;

  // QR Code Container
  const qrSize = 90;
  const qrBoxX = stubCenter - (qrSize/2);
  
  doc.rect(qrBoxX - 4, stubY - 4, qrSize + 8, qrSize + 8)
      .strokeColor(COLORS.ACCENT_GOLD).lineWidth(1).stroke();

  if (ticketInfo.qrCode) {
    try {
      const base64Image = ticketInfo.qrCode.replace(/^data:image\/[a-z]+;base64,/, "");
      const qrBuffer = Buffer.from(base64Image, 'base64');
      doc.image(qrBuffer, qrBoxX, stubY, { width: qrSize, height: qrSize });
    } catch (e) {
      doc.fontSize(8).fillColor(COLORS.INVALID).text("QR Error", qrBoxX, stubY + 40, { align: 'center', width: qrSize });
    }
  }

  stubY += qrSize + 15;

  // Ticket ID
  doc.font("Courier").fontSize(8).fillColor(COLORS.TEXT_SECONDARY)
      .text(ticketInfo.type_id || "ID: ####", splitX, stubY, { width: stubWidth, align: "center" });

  stubY += 20;

  // Status Badge
  const normalizedStatus = (ticketInfo.status || "VALID").toString().trim().toLowerCase();
  const effectiveStatus = normalizedStatus || "valid";
  const statusColor = effectiveStatus === "valid" ? COLORS.VALID : COLORS.INVALID;
  
  const pillWidth = 60;
  const pillHeight = 16;
  const pillX = stubCenter - (pillWidth/2);
  
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

  doc.end();
  return await pdfBufferPromise;
}

/**
 * Generates a PDF buffer for Event tickets
 */
async function generateEventTicketPDF(ticketInfo) {
  // 1. Setup PDF Document
  // Ensure PDFDocument is available in your scope
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    autoFirstPage: true
  });

  const pdfBufferPromise = buffer(doc);

  // --- Museum / Professional Palette ---
  const COLORS = {
    BG_PAPER: "#FDFBF7",       // Warmer, premium paper tone
    ACCENT_GOLD: "#C5A059",    // Muted, elegant gold
    TEXT_PRIMARY: "#2C2C2C",   // Soft black for readability
    TEXT_SECONDARY: "#666666", // Grey for labels
    DIVIDER: "#E0E0E0",
    VALID: "#2F855A",
    INVALID: "#C53030",
  };

  try {
    // 2. Full Page Background (Paper Texture color)
    doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.BG_PAPER);

    // --- TICKET CARD GEOMETRY ---
    const cardWidth = 500;
    const cardHeight = 260; 
    const cardX = (doc.page.width - cardWidth) / 2;
    const cardY = (doc.page.height - cardHeight) / 2 - 20; // Vertically centered
    const cornerRadius = 8;

    // 3. Drop Shadow (Soft & Diffused)
    doc.save();
    doc.roundedRect(cardX + 5, cardY + 5, cardWidth, cardHeight, cornerRadius)
       .fillColor("black")
       .fillOpacity(0.08)
       .fill();
    doc.restore();

    // 4. Main Card Background
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, cornerRadius)
       .fillColor("white")
       .fill();
    
    // 5. Main Border
    doc.save();
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, cornerRadius)
       .lineWidth(1.5) 
       .strokeColor(COLORS.ACCENT_GOLD)
       .stroke();
    doc.restore();
    
    // 6. Top Accent Border (Gold Header Block)
    doc.save();
    doc.path(`M ${cardX+cornerRadius} ${cardY} L ${cardX+cardWidth-cornerRadius} ${cardY} Q ${cardX+cardWidth} ${cardY} ${cardX+cardWidth} ${cardY+cornerRadius} L ${cardX+cardWidth} ${cardY+6} L ${cardX} ${cardY+6} L ${cardX} ${cardY+cornerRadius} Q ${cardX} ${cardY} ${cardX+cornerRadius} ${cardY}`)
       .fillColor(COLORS.ACCENT_GOLD)
       .fill();
    doc.restore();

    // --- LAYOUT CONSTANTS ---
    const splitX = cardX + 340; // The "tear line"
    const contentPadding = 25;
    const leftColX = cardX + contentPadding;

    // 7. PERFORATION LINE (Dashed Divider)
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

    // Event Label
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.ACCENT_GOLD)
       .text("OFFICIAL ENTRY TICKET", leftColX, currentY);
    
    currentY += 15;

    // Event Title (Big & Serif)
    const eventTitle = ticketInfo.event_title?.toUpperCase() || "EVENT TITLE";
    doc.font("Times-Bold").fontSize(22).fillColor(COLORS.TEXT_PRIMARY)
       .text(eventTitle, leftColX, currentY, { width: 300, lineGap: 5, ellipsis: true });

    // Calculate height used by title
    const titleHeight = doc.heightOfString(eventTitle, { width: 300 });
    currentY += titleHeight + 15;

    // Info Grid
    const labelSize = 7;
    const valueSize = 11;
    const gridStartY = currentY;

    // ROW 1: Date & Time
    doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY).text("DATE", leftColX, gridStartY);
    doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY).text("TIME", leftColX + 150, gridStartY);
    
    const dateStr = ticketInfo.visit_date ? moment(ticketInfo.visit_date).format("MMM DD, YYYY") : "N/A";
    
    // Time Logic adaptation
    let timeRange = "N/A";
    if (ticketInfo.start_time && ticketInfo.end_time) {
        const start = moment(ticketInfo.start_time, ["HH:mm", "HH:mm:ss"]).format("h:mm A");
        const end = moment(ticketInfo.end_time, ["HH:mm", "HH:mm:ss"]).format("h:mm A");
        timeRange = `${start} - ${end}`;
    } else if (ticketInfo.event_time) {
        timeRange = ticketInfo.event_time;
    } else if (ticketInfo.visit_date) {
        timeRange = moment(ticketInfo.visit_date).format("h:mm A");
    }

    doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY).text(dateStr, leftColX, gridStartY + 12);
    doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY).text(timeRange, leftColX + 150, gridStartY + 12);

    // ROW 2: Location & Ticket Type
    const row2Y = gridStartY + 45;
    doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY).text("LOCATION", leftColX, row2Y);
    doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY).text("TYPE", leftColX + 150, row2Y);
    
    const locationText = ticketInfo.location || ticketInfo.venue || ticketInfo.location_name || ticketInfo.address || "TBD";
    
    doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
       .text(locationText, leftColX, row2Y + 12, { width: 140, height: 30, ellipsis: true });
    
    const ticketTypeText = ticketInfo.type || ticketInfo.ticket_id || ticketInfo.ticket || ticketInfo.ticket_type || ticketInfo.type_name || "Standard";
    doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
       .text(ticketTypeText, leftColX + 150, row2Y + 12);

    // ROW 3: Holder Email
    const row3Y = row2Y + 45;
    doc.font("Helvetica-Bold").fontSize(labelSize).fillColor(COLORS.TEXT_SECONDARY).text("TICKET HOLDER", leftColX, row3Y);
    doc.font("Times-Roman").fontSize(valueSize).fillColor(COLORS.TEXT_PRIMARY)
       .text(ticketInfo.email || "Guest", leftColX, row3Y + 12, {width: 280, ellipsis: true});


    // --- RIGHT SIDE: STUB & QR ---
    const stubWidth = cardWidth - (splitX - cardX);
    const stubCenter = splitX + (stubWidth / 2);
    let stubY = cardY + 35;

    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.TEXT_PRIMARY)
       .text("ADMIT ONE", splitX, stubY, { width: stubWidth, align: "center" });

    stubY += 25;

    // QR Code Container
    const qrSize = 90;
    const qrBoxX = stubCenter - (qrSize/2);
    
    // QR Border
    doc.rect(qrBoxX - 4, stubY - 4, qrSize + 8, qrSize + 8)
       .strokeColor(COLORS.ACCENT_GOLD).lineWidth(1).stroke();

    if (ticketInfo.qrCode) {
        try {
            // Normalize Base64 string
            const base64Image = ticketInfo.qrCode.replace(/^data:image\/[a-z]+;base64,/, "");
            const qrBuffer = Buffer.from(base64Image, "base64");
            doc.image(qrBuffer, qrBoxX, stubY, { width: qrSize, height: qrSize });
        } catch (e) {
            doc.fontSize(8).fillColor(COLORS.INVALID).text("QR Err", qrBoxX, stubY + 40, { align: 'center', width: qrSize });
        }
    }

    stubY += qrSize + 15;

    // Ticket ID
    doc.font("Courier").fontSize(8).fillColor(COLORS.TEXT_SECONDARY)
       .text(ticketInfo.type_id || "ID: ####", splitX, stubY, { width: stubWidth, align: "center" });

    stubY += 20;

    // Status Badge (Pill shape)
    const rawStatus = (ticketInfo.status || "VALID").toString().toLowerCase();
    const statusText = rawStatus.toUpperCase();
    const statusColor = rawStatus === "valid" ? COLORS.VALID : COLORS.INVALID;
    
    const pillWidth = 60;
    const pillHeight = 16;
    const pillX = stubCenter - (pillWidth/2);
    
    doc.roundedRect(pillX, stubY, pillWidth, pillHeight, 8)
       .fillColor(statusColor).fillOpacity(0.1).fill();
    
    doc.font("Helvetica-Bold").fontSize(7).fillColor(statusColor).fillOpacity(1)
       .text(statusText, pillX, stubY + 4, { width: pillWidth, align: "center" });


    // --- FOOTER ---
    const footerY = cardY + cardHeight - 25;
    
    doc.moveTo(cardX + 10, footerY).lineTo(cardX + cardWidth - 10, footerY)
       .strokeColor(COLORS.ACCENT_GOLD).lineWidth(1).stroke();

    doc.font("Times-Italic").fontSize(7).fillColor(COLORS.TEXT_SECONDARY)
       .text("Authorized by Adwa Event Portal. Present this ticket at the entrance.", cardX, footerY + 8, { width: cardWidth, align: "center" });

  } catch (error) {
    console.error("PDF generation error inside function:", error);
    // You might want to handle this differently depending on your error handling strategy
    doc.text("Error generating ticket visual.");
  }

  doc.end();
  return await pdfBufferPromise;
}

export { generateTicketPDF, generateEventTicketPDF };
