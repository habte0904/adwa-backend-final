import * as bookingService from '../services/booking.service.js';

export const getBookingConfirmation = async (req, res) => {
  const { chapa_tx_ref } = req.params;
  console.log("chapa_tx_ref from params:", chapa_tx_ref);

  try {
    const data = await bookingService.getBookingDetails(chapa_tx_ref);

    if (!data) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json({
      message: 'Booking details retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Error fetching booking confirmation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
