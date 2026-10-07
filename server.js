
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public folder
app.use(express.static(path.join(__dirname, "public")));

// VIP ODDS
let odds = [
  {
    id: 1,
    match: "Arsenal vs Chelsea",
    pick: "Over 2.5",
    odd: 1.85,
    status: "VIP"
  },
  {
    id: 2,
    match: "Barcelona vs Sevilla",
    pick: "Barcelona Win",
    odd: 1.60,
    status: "VIP"
  },
  {
    id: 3,
    match: "Real Madrid vs Valencia",
    pick: "Both Teams To Score",
    odd: 1.75,
    status: "VIP"
  }
];

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    app: "YUSUPHU ODDS VIP"
  });
});

// GET ODDS
app.get("/api/odds", (req, res) => {
  res.json({
    success: true,
    odds: odds
  });
});

// ADD ODDS
app.post("/api/odds", (req, res) => {
  const { match, pick, odd } = req.body;

  if (!match || !pick || !odd) {
    return res.status(400).json({
      success: false,
      message: "Jaza match, pick na odd."
    });
  }

  const newOdd = {
    id: Date.now(),
    match: match,
    pick: pick,
    odd: Number(odd),
    status: "VIP"
  };

  odds.unshift(newOdd);

  res.status(201).json({
    success: true,
    message: "Odd imeongezwa.",
    odd: newOdd
  });
});

// DELETE ODDS
app.delete("/api/odds/:id", (req, res) => {
  const id = Number(req.params.id);

  const oldLength = odds.length;

  odds = odds.filter((item) => item.id !== id);

  if (odds.length === oldLength) {
    return res.status(404).json({
      success: false,
      message: "Odd haijapatikana."
    });
  }

  res.json({
    success: true,
    message: "Odd imefutwa."
  });
});

// PAYMENT VERIFICATION
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
    message: "Payment request received.",
    phone: phone,
    amount: amount,
    reference: reference || null
  });
});

// 404 API
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint haijapatikana."
  });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `YUSUPHU ODDS VIP server running on port ${PORT}`
  );
});
