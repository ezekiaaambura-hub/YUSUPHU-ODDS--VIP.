const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "YUSUPHU2026";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// PUBLIC FOLDER
// ===============================
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// DATA STORAGE
// ===============================
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(
    dataFile,
    JSON.stringify(
      {
        payments: [],
        odds: []
      },
      null,
      2
    )
  );
}

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    return {
      payments: [],
      odds: []
    };
  }
}

function saveStore(store) {
  fs.writeFileSync(
    dataFile,
    JSON.stringify(store, null, 2)
  );
}

// ===============================
// HOME
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "YUSUPHU ODDS VIP server iko hewani."
  });
});

// ===============================
// CUSTOMER PAYMENT
// ===============================
app.post("/api/payment", (req, res) => {
  const { reference, method } = req.body;

  if (!method) {
    return res.status(400).json({
      success: false,
      message: "Chagua njia ya malipo."
    });
  }

  if (!reference || !reference.trim()) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  const store = loadStore();

  const cleanReference = reference.trim();

  const existing = store.payments.find(
    payment =>
      payment.reference.toLowerCase() ===
      cleanReference.toLowerCase()
  );

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Payment Reference hii tayari imetumwa."
    });
  }

  const payment = {
    id: Date.now(),
    reference: cleanReference,
    method: method,
    amount: 5000,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  store.payments.unshift(payment);
  saveStore(store);

  res.json({
    success: true,
    message:
      "Malipo yamepokelewa. Subiri Admin athibitishe.",
    payment
  });
});

// ===============================
// CHECK PAYMENT
// ===============================
app.get("/api/payment/:reference", (req, res) => {
  const store = loadStore();

  const reference = req.params.reference;

  const payment = store.payments.find(
    item =>
      item.reference.toLowerCase() ===
      reference.toLowerCase()
  );

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment Reference haijapatikana."
    });
  }

  res.json({
    success: true,
    payment
  });
});

// ===============================
// VIP ACCESS
// ===============================
app.get("/api/vip/:reference", (req, res) => {
  const store = loadStore();

  const reference = req.params.reference;

  const payment = store.payments.find(
    item =>
      item.reference.toLowerCase() ===
      reference.toLowerCase()
  );

  if (!payment) {
    return res.status(404).json({
      success: false,
      unlocked: false,
      message: "Payment Reference haijapatikana."
    });
  }

  if (payment.status !== "approved") {
    return res.json({
      success: true,
      unlocked: false,
      status: payment.status,
      message:
        "Malipo bado hayajaidhinishwa na Admin."
    });
  }

  res.json({
    success: true,
    unlocked: true,
    message: "VIP imefunguliwa.",
    odds: store.odds
  });
});

// ===============================
// ADMIN AUTHENTICATION
// ===============================
function adminAuth(req, res, next) {
  const password = req.headers["x-admin-password"];

  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Password ya Admin si sahihi."
    });
  }

  next();
}

// ===============================
// ADMIN - VIEW PAYMENTS
// ===============================
app.get(
  "/api/admin/payments",
  adminAuth,
  (req, res) => {
    const store = loadStore();

    res.json({
      success: true,
      payments: store.payments
    });
  }
);

// ===============================
// ADMIN - APPROVE PAYMENT
// ===============================
app.post(
  "/api/admin/payments/:id/approve",
  adminAuth,
  (req, res) => {
    const store = loadStore();

    const id = Number(req.params.id);

    const payment = store.payments.find(
      item => item.id === id
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Malipo hayajapatikana."
      });
    }

    payment.status = "approved";
    payment.approvedAt = new Date().toISOString();

    saveStore(store);

    res.json({
      success: true,
      message: "Malipo yameidhinishwa.",
      payment
    });
  }
);

// ===============================
// ADMIN - REJECT PAYMENT
// ===============================
app.post(
  "/api/admin/payments/:id/reject",
  adminAuth,
  (req, res) => {
    const store = loadStore();

    const id = Number(req.params.id);

    const payment = store.payments.find(
      item => item.id === id
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Malipo hayajapatikana."
      });
    }

    payment.status = "rejected";
    payment.rejectedAt = new Date().toISOString();

    saveStore(store);

    res.json({
      success: true,
      message: "Malipo yamekataliwa.",
      payment
    });
  }
);

// ===============================
// ADMIN - ADD ODDS
// ===============================
app.post(
  "/api/admin/odds",
  adminAuth,
  (req, res) => {
    const {
      title,
      match,
      prediction,
      odd
    } = req.body;

    if (
      !title ||
      !match ||
      !prediction ||
      !odd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Jaza taarifa zote za odds."
      });
    }

    const store = loadStore();

    const newOdd = {
      id: Date.now(),
      title: title.trim(),
      match: match.trim(),
      prediction: prediction.trim(),
      odd: odd,
      createdAt: new Date().toISOString()
    };

    store.odds.unshift(newOdd);

    saveStore(store);

    res.json({
      success: true,
      message: "Odds imeongezwa.",
      odd: newOdd
    });
  }
);

// ===============================
// ADMIN - VIEW ODDS
// ===============================
app.get(
  "/api/admin/odds",
  adminAuth,
  (req, res) => {
    const store = loadStore();

    res.json({
      success: true,
      odds: store.odds
    });
  }
);

// ===============================
// START SERVER
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `YUSUPHU ODDS VIP server running on port ${PORT}`
  );
});
