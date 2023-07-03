const express = require("express");
const app = express();
const axios = require("axios");
require("dotenv").config();

app.use(express.json());

const api_Public_Key = process.env.BUDPAY_PUBLIC_KEY;
const api_Secret_Key = process.env.BUDPAY_SECRET_KEY;

async function processPayment() {
  try {
    const paymentIntent = await createPaymentIntent();

    const paymentUrl = getPaymentUrl(paymentIntent.id);

    console.log("Payment URL:", paymentUrl);
  } catch (error) {
    console.error("Payment failed:", error.message);
  }
}

async function createPaymentIntent() {
  const url = "https://api.budpay.com/api/v2/payment_intents";

  const response = await axios.post(
    url,
    {
      amount: 1000,
      currency: "USD",
      description: "One-time payment",
    },
    {
      auth: {
        username: api_Public_Key,
        password: api_Secret_Key,
      },
    }
  );

  return response.data;
}

function getPaymentUrl(paymentIntentId) {
  return `https://payment.budpay.com/${paymentIntentId}`;
}

processPayment();

app.post("/payment-notification", async (req, res) => {
  try {
    const isValid = await verifyPaymentNotification(req.body);

    if (isValid) {
      console.log("Payment processed successfully:", req.body);
      res.status(200).send({ message: "Payment processed successfully" });
    } else {
      console.error("Invalid payment notification");
      res.status(400).send({ message: "Invalid payment notification" });
    }
  } catch (error) {
    console.error("Error processing payment notification:", error.message);
    res.status(500).send({ error });
  }
});

async function verifyPaymentNotification(notification) {
  const { paymentId, amount, currency, signature, transactionDetails } =
    notification;

  const isSignatureValid = await verifySignature(
    signature,
    paymentId,
    amount,
    currency
  );
  if (!isSignatureValid) {
    return false;
  }

  const isTransactionValid = await verifyTransaction(
    transactionDetails,
    amount
  );
  if (!isTransactionValid) {
    return false;
  }
  return true;
}

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
