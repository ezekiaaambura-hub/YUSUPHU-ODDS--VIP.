
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VIP_PRICE = 5000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

const PAYMENT_NUMBERS = {
  "M-Pesa": "0793401886",
  "Airtel Money": "0692359311",
  "HaloPesa": "0613431930"
};

let odds = [];
let payments = [];
let nextOddId = 1;
let nextPaymentId = 1;

function requireAdmin(req, res, next) {
  const password = req.get("X-Admin-Password") || "";

  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      success: false,
      message: "Weka ADMIN_PASSWORD kwenye Render Environment."
    });
  }

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Password ya Admin si sahihi."
    });
  }

  next();
}

// HOME PAGE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ success: true, app: "YUSUPHU ODDS VIP" });
});

// PAYMENT SETTINGS
app.get("/api/config", (req, res) => {
  res.json({
    price: VIP_PRICE,
    paymentNumbers: PAYMENT_NUMBERS,
    visaEnabled: false
  });
});

// SHOW ODDS
app.get("/api/odds", (req, res) => {
  res.json(odds);
});

// ADD ODDS — ADMIN
app.post("/api/odds", requireAdmin, (req, res) => {
  const match = String(req.body.match || "").trim();

  const prediction = String(
    req.body.prediction || req.body.pick || ""
  ).trim();

  const odd = Number(req.body.odd);

  const type = String(
    req.body.type || req.body.status || "VIP"
  ).trim().toUpperCase();

  if (!match || !prediction || !Number.isFinite(odd) || odd < 1) {
    return res.status(400).json({
      success: false,
      message: "Jaza mechi, utabiri na odd sahihi."
    });
  }

  if (!["FREE", "VIP"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Chagua FREE ODDS au VIP ODDS."
    });
  }

  const item = {
    id: nextOddId++,
    match,
    prediction,
    pick: prediction,
    odd,
    status: type,
    type,
    createdAt: new Date().toISOString()
  };

  odds.unshift(item);

  return res.status(201).json({
    success: true,
    message: type === "FREE"
      ? "FREE ODDS zimeongezwa."
      : "VIP ODDS zimeongezwa.",
    odd: item
  });
});
    req.body.prediction || req.body.pick || ""
  ).trim();
  const odd = Number(req.body.odd);

  if (!match || !prediction || !Number.isFinite(odd) || odd < 1) {
    return res.status(400).json({
      success: false,
      message: "Jaza mechi, utabiri na odd sahihi."
    });
  }

  const item = {
    id: nextOddId++,
    match,
    prediction,
    pick: prediction,
    odd,
    status: "VIP",
    createdAt: new Date().toISOString()
  };

  odds.unshift(item);
  res.status(201).json({ success: true, odd: item });
});

// DELETE ODDS — ADMIN
app.delete("/api/odds/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const oldLength = odds.length;

  odds = odds.filter(item => item.id !== id);

  if (oldLength === odds.length) {
    return res.status(404).json({
      success: false,
      message: "Odd haijapatikana."
    });
  }

  res.json({ success: true, message: "Odd imefutwa." });
});

// SUBMIT PAYMENT REFERENCE
// Hii inapokea ombi tu; haithibitishi fedha moja kwa moja.
app.post("/api/payment", (req, res) => {
  const reference = String(req.body.reference || "").trim();
  const method = String(req.body.method || "").trim();

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  if (!Object.prototype.hasOwnProperty.call(PAYMENT_NUMBERS, method)) {
    return res.status(400).json({
      success: false,
      message: "Chagua njia sahihi ya malipo."
    });
  }

  const duplicate = payments.some(
    p => p.reference.toLowerCase() === reference.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "Reference hii imeshatumwa."
    });
  }

  const payment = {
    id: nextPaymentId++,
    reference,
    method,
    phone: PAYMENT_NUMBERS[method],
    amount: VIP_PRICE,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  payments.unshift(payment);

  res.status(201).json({
    success: true,
    message: "Ombi limepokelewa. Subiri Admin athibitishe muamala.",
    payment: {
      id: payment.id,
      reference: payment.reference,
      method: payment.method,
      amount: payment.amount,
      status: payment.status
    }
  });
});

// ADMIN LOGIN CHECK
app.get("/api/payments", requireAdmin, (req, res) => {
  res.json(payments);
});

// ADMIN: APPROVE OR REJECT PAYMENT
app.patch("/api/payments/:id/status", requireAdmin, (req, res) => {
  const payment = payments.find(
    p => p.id === Number(req.params.id)
  );

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Ombi la malipo halijapatikana."
    });
  }

  const status = String(req.body.status || "").toUpperCase();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Hali ya malipo si sahihi."
    });
  }

  payment.status = status;
  payment.reviewedAt = new Date().toISOString();

  res.json({
    success: true,
    message: "Hali ya malipo imebadilishwa.",
    payment
  });
});

// START SERVER
app.listen(PORT, "0.0.0.0", () => {
  console.log("YUSUPHU ODDS VIP running on port " + PORT);
});
