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
  } catch (error) {
    console.error("Payment failed:", error.message);
  }
}

async function createPaymentLink() {
  const url = "https://api.budpay.com/api/v2/create_payment_link";

  const response = await axios.post(
    url,
    {
      amount: "2500",
      currency: "NGN",
      name: "Name",
      description: "my description",
      redirect: "https://your_redirect_link",
    },
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.paymentUrl;
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
    await processPayment();
    res.status(200).send({ message: "Payment processing initiated" });
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
