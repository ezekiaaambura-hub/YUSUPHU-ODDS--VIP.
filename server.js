
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "YUSUPHU2026";

if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD haijawekwa.");
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");

const initial = () => ({
  payments: [],
  odds: [
    {
      id: 1,
      match: "Manchester United",
      pick: "Double Chance",
      odd: 1.50,
      type: "FREE"
    },
    {
      id: 2,
      match: "Barcelona",
      pick: "Over 1.5 Goals",
      odd: 1.50,
      type: "FREE"
    },
    {
      id: 3,
      match: "Real Madrid",
      pick: "To Win",
      odd: 1.60,
      type: "FREE"
    }
  ],
  settings: {
    paymentNumbers: {
      "M-Pesa": "0793401886",
      "Airtel Money": "0692359311",
      "HaloPesa": "0613431930"
    },
    links: {
      "GAL Sport": "https://www.galsports.co.tz/",
      "Betika": "https://www.betika.com/"
    }
  }
});

function normalizeOdds(items) {
  if (!Array.isArray(items)) return [];

  const result = [];

  for (const item of items) {
    if (item && item.match) {
      result.push({
        id: Number(item.id) || Date.now() + result.length,
        match: String(item.match),
        pick: String(item.pick || item.prediction || ""),
        odd: Number(item.odd) || 1,
        type: String(item.type || "FREE").toUpperCase()
      });
    } else if (item && Array.isArray(item.matches)) {
      item.matches.forEach((match, i) => {
        result.push({
          id: Number(item.id) + i || Date.now() + result.length,
          match: String(match),
          pick: "Utabiri",
          odd: 1,
          type: "FREE"
        });
      });
    }
  }

  return result;
}

function load() {
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(dataFile)) {
    const data = initial();
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return data;
  }

  try {
    const old = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const defaults = initial();

    return {
      payments: Array.isArray(old.payments)
        ? old.payments.map(p => ({
            ...p,
            status: String(p.status || "pending").toUpperCase()
          }))
        : [],
      odds: normalizeOdds(old.odds || defaults.odds),
      settings: {
        paymentNumbers: {
          ...defaults.settings.paymentNumbers,
          ...(old.settings?.paymentNumbers || {})
        },
        links: {
          ...defaults.settings.links,
          ...(old.settings?.links || {})
        }
      }
    };
  } catch (error) {
    console.error("Store haikusomeka:", error);
    throw error;
  }
}

let store = load();

function save() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

const adminTokens = new Map();

function auth(req, res, next) {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Kikao cha Admin kimeisha. Ingia tena."
    });
  }

  next();
}

function adminError(res, error) {
  console.error(error);
  return res.status(500).json({
    success: false,
    message: "Hitilafu ya server. Jaribu tena."
  });
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "YUSUPHU ODDS VIP iko Live."
  });
});

// FREE ODDS
app.get("/api/odds", (req, res) => {
  res.json(store.odds.filter(o => o.type === "FREE"));
});

// PAYMENT CONFIGURATION
app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    paymentNumbers: store.settings.paymentNumbers
  });
});

// CUSTOMER PAYMENT SUBMISSION
app.post("/api/payment", (req, res) => {
  try {
    const reference = String(req.body.reference || "").trim();
    const method = String(req.body.method || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!Object.hasOwn(store.settings.paymentNumbers, method)) {
      return res.status(400).json({
        success: false,
        message: "Chagua mtandao sahihi wa malipo."
      });
    }

    if (!reference || reference.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Weka Payment Reference sahihi."
      });
    }

    if (
      store.payments.some(
        p => String(p.reference).toLowerCase() === reference.toLowerCase()
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "Payment Reference hii tayari imewasilishwa."
      });
    }

    const payment = {
      id: Date.now(),
      reference,
      method,
      phone,
      amount: 5000,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    store.payments.unshift(payment);
    save();

    res.json({
      success: true,
      message: "Malipo yamepokelewa. Subiri Admin athibitishe.",
      payment
    });
  } catch (error) {
    adminError(res, error);
  }
});

// CHECK PAYMENT
app.get("/api/payment/:reference", (req, res) => {
  const p = store.payments.find(
    x => String(x.reference).toLowerCase() ===
      String(req.params.reference).toLowerCase()
  );

  if (!p) {
    return res.status(404).json({
      success: false,
      message: "Payment Reference haijapatikana."
    });
  }

  res.json({ success: true, payment: p });
});

// VIP ACCESS BY PHONE
app.get("/api/vip/access", (req, res) => {
  const phone = String(req.query.phone || "").trim();

  const payment = store.payments.find(
    p => p.phone === phone && p.status === "APPROVED"
  );

  if (!payment) {
    return res.json({
      success: true,
      access: false,
      message: "VIP bado haijafunguliwa. Subiri Admin athibitishe malipo."
    });
  }

  res.json({
    success: true,
    access: true,
    odds: store.odds.filter(o => o.type === "VIP")
  });
});

// VIP ACCESS BY REFERENCE
app.get("/api/vip/:reference", (req, res) => {
  const payment = store.payments.find(
    p =>
      String(p.reference).toLowerCase() ===
        String(req.params.reference).toLowerCase() &&
      p.status === "APPROVED"
  );

  if (!payment) {
    return res.status(403).json({
      success: false,
      message: "VIP bado haijafunguliwa."
    });
  }

  res.json({
    success: true,
    message: "VIP imefunguliwa.",
    odds: store.odds.filter(o => o.type === "VIP")
  });
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
  const password = String(req.body.password || "");

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Password ya Admin si sahihi."
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  adminTokens.set(token, Date.now());

  res.json({
    success: true,
    token,
    message: "Umeingia Admin."
  });
});

// ADMIN LOGOUT
app.post("/api/admin/logout", auth, (req, res) => {
  const token = String(req.headers.authorization || "").slice(7);
  adminTokens.delete(token);

  res.json({ success: true, message: "Umetoka kwenye Admin." });
});

// ADMIN DASHBOARD DATA
app.get("/api/admin/data", auth, (req, res) => {
  res.json({
    success: true,
    odds: store.odds,
    payments: store.payments,
    settings: store.settings
  });
});

// ADMIN PAYMENT STATUS
app.patch("/api/admin/payments/:id", auth, (req, res) => {
  const status = String(req.body.status || "").toUpperCase();

  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Hali ya malipo si sahihi."
    });
  }

  const payment = store.payments.find(
    p => p.id === Number(req.params.id)
  );

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Malipo hayajapatikana."
    });
  }

  payment.status = status;
  payment.updatedAt = new Date().toISOString();
  save();

  res.json({
    success: true,
    message: "Hali ya malipo imebadilishwa.",
    payment
  });
});

app.get("/api/admin/payments", auth, (req, res) => {
  res.json({ success: true, payments: store.payments });
});

app.post("/api/admin/payments/:id/approve", auth, (req, res) => {
  const payment = store.payments.find(
    p => p.id === Number(req.params.id)
  );

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Malipo hayajapatikana."
    });
  }

  payment.status = "APPROVED";
  payment.approvedAt = new Date().toISOString();
  save();

  res.json({ success: true, payment });
});

app.post("/api/admin/payments/:id/reject", auth, (req, res) => {
  const payment = store.payments.find(
    p => p.id === Number(req.params.id)
  );

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Malipo hayajapatikana."
    });
  }

  payment.status = "REJECTED";
  payment.rejectedAt = new Date().toISOString();
  save();

  res.json({ success: true, payment });
});

// ADD ODDS
app.post("/api/admin/odds", auth, (req, res) => {
  const match = String(req.body.match || "").trim();
  const pick = String(req.body.pick || req.body.prediction || "").trim();
  const odd = Number(req.body.odd);
  const type = String(req.body.type || "FREE").toUpperCase();

  if (
    !match ||
    !pick ||
    !Number.isFinite(odd) ||
    odd <= 1 ||
    !["FREE", "VIP"].includes(type)
  ) {
    return res.status(400).json({
      success: false,
      message: "Weka mechi, utabiri, odd na aina sahihi."
    });
  }

  const item = { id: Date.now(), match, pick, odd, type };
  store.odds.unshift(item);
  save();

  res.json({ success: true, message: "Odd imeongezwa.", odd: item });
});

// LIST ODDS FOR ADMIN
app.get("/api/admin/odds", auth, (req, res) => {
  res.json({ success: true, odds: store.odds });
});

// EDIT ODDS
app.put("/api/admin/odds/:id", auth, (req, res) => {
  const item = store.odds.find(o => o.id === Number(req.params.id));

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Odd haijapatikana."
    });
  }

  const match = String(req.body.match || "").trim();
  const pick = String(req.body.pick || "").trim();
  const odd = Number(req.body.odd);
  const type = String(req.body.type || "").toUpperCase();

  if (
    !match ||
    !pick ||
    !Number.isFinite(odd) ||
    odd <= 1 ||
    !["FREE", "VIP"].includes(type)
  ) {
    return res.status(400).json({
      success: false,
      message: "Taarifa za odd si sahihi."
    });
  }

  Object.assign(item, { match, pick, odd, type });
  save();

  res.json({ success: true, message: "Odd imehaririwa.", odd: item });
});

// DELETE ODDS
app.delete("/api/admin/odds/:id", auth, (req, res) => {
  const index = store.odds.findIndex(
    o => o.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Odd haijapatikana."
    });
  }

  store.odds.splice(index, 1);
  save();

  res.json({ success: true, message: "Odd imefutwa." });
});

// ADMIN SETTINGS
app.put("/api/admin/settings", auth, (req, res) => {
  const numbers = req.body.paymentNumbers || {};
  const links = req.body.links || {};

  for (const key of ["M-Pesa", "Airtel Money", "HaloPesa"]) {
    const value = String(numbers[key] || "").trim();

    if (!/^[0-9+\s-]{9,20}$/.test(value)) {
      return res.status(400).json({
        success: false,
        message: "Namba ya " + key + " si sahihi."
      });
    }
  }

  for (const key of ["GAL Sport", "Betika"]) {
    try {
      const url = new URL(String(links[key] || ""));
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("URL si sahihi");
      }
    } catch {
      return res.status(400).json({
        success: false,
        message: "Kiungo cha " + key + " si sahihi."
      });
    }
  }

  store.settings.paymentNumbers = {
    "M-Pesa": String(numbers["M-Pesa"]).trim(),
    "Airtel Money": String(numbers["Airtel Money"]).trim(),
    "HaloPesa": String(numbers["HaloPesa"]).trim()
  };

  store.settings.links = {
    "GAL Sport": String(links["GAL Sport"]).trim(),
    "Betika": String(links["Betika"]).trim()
  };

  save();

  res.json({
    success: true,
    message: "Mipangilio imehifadhiwa."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("YUSUPHU ODDS VIP running on port " + PORT);
});
