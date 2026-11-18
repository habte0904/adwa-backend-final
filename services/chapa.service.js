import axios from "axios";

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

export const createChapaPaymentURL = async ({ email, amount, tx_ref, return_url }) => {
  try {
    const response = await axios.post(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        amount,
        currency: "ETB",
        email,
        tx_ref,
        return_url, // The URL Chapa will redirect the user back to
      },
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.data; // contains checkout_url
  } catch (error) {
    console.error("Error creating Chapa payment:", error.response?.data || error.message);
    throw new Error("Failed to initialize Chapa payment");
  }
};

export const verifyChapaPayment = async (tx_ref) => {
  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error verifying Chapa payment:", error.response?.data || error.message);
    throw new Error("Failed to verify Chapa payment");
  }
};
