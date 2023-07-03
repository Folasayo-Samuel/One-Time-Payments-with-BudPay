const express = require("express");
const app = express();
const axios = require("axios");
require("dotenv").config();

app.use(express.json());

const secretKey = process.env.BUDPAY_SECRET_KEY;

async function processPayment() {
  try {
    const paymentUrl = await createPaymentLink();
    console.log("Payment URL:", paymentUrl);
    return paymentUrl;
  } catch (error) {
    console.error("Payment failed:", error.message);
    // throw error;
  }
}

async function createPaymentLink() {
  const url = "https://api.budpay.com/api/v2/create_payment_link";

  const requestData = {
    amount: "2500",
    currency: "NGN",
    name: "Folasayo Samuel",
    description: "my description",
    redirect: "https://www.google.com",
  };

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(url, requestData, { headers });
    const responseData = response.data;
    const { ref_id, payment_link } = responseData.data;
    return { ref_id, payment_link };
  } catch (error) {
    console.error("Error creating payment link:", error.message);
    throw error;
  }
}

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
    res.status(500).send(error.message);
  }
});

app.post("/process-payment", async (req, res) => {
  try {
    const paymentData = await processPayment();
    res
      .status(200)
      .send({ message: "Payment processing initiated", data: paymentData });
  } catch (error) {
    console.error("Error processing payment:", error.message);
    res.status(500).send(error.message);
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
