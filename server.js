const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const odds = [
  { id: 1, match: "Manchester United vs Chelsea", market: "1X2", pick: "1", odd: 2.10 },
  { id: 2, match: "Arsenal vs Liverpool", market: "Over/Under", pick: "Over 2.5", odd: 1.85 },
  { id: 3, match: "Barcelona vs Real Madrid", market: "1X2", pick: "X", odd: 3.40 }
];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "YUSUPHU ODDS VIP" });
});

app.get("/api/odds", (req, res) => {
  res.json({ success: true, odds });
});

app.post("/api/payment/verify", (req, res) => {
  const { phone, amount, reference } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({
      success: false,
      message: "Phone number and amount are required."
    });
  }

  res.json({
    success: true,
    message: "Payment request received. Verification can be connected to your payment provider.",
    phone,
    amount,
    reference: reference || null
  });
});

app.listen(PORT, () => {
  console.log(`YUSUPHU ODDS VIP server running on port ${PORT}`);
});
