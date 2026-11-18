import eventTicketTypeService from '../services/eventTicketType.service.js';

// Create Ticket Type for Event
export const createEventTicketType = async (req, res) => {
  try {
    const ticketId = await eventTicketTypeService.createEventTicketType(req.body);
    res.status(201).json({ ticket_id: ticketId, message: 'Ticket type created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Ticket Types for an Event
export const getEventTicketTypes = async (req, res) => {
  try {
    const { event_id } = req.params;
    const ticketTypes = await eventTicketTypeService.getEventTicketTypes(event_id);
    res.status(200).json(ticketTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Ticket Type
export const updateEventTicketType = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const result = await eventTicketTypeService.updateEventTicketType(ticket_id, req.body);
    res.status(200).json({ ...result, message: 'Ticket type updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Ticket Type
export const deleteEventTicketType = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const result = await eventTicketTypeService.deleteEventTicketType(ticket_id);
    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ message: 'Ticket type not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

