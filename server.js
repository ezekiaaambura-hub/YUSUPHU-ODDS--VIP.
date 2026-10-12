const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "BadilishaAdmin123!";
const VIP_PRICE = 5000;
const DATA_FILE = path.join(__dirname, "data.json");

9app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

const DEFAULT_DATA = {
  odds: [
    { id: 1, match: "Arsenal vs Chelsea", pick: "Over 2.5", odd: 1.85, type: "VIP" },
    { id: 2, match: "Barcelona vs Sevilla", pick: "Barcelona Win", odd: 1.60, type: "VIP" },
    { id: 3, match: "Real Madrid vs Valencia", pick: "Both Teams To Score", odd: 1.75, type: "FREE" }
  ],
  payments: [],
  settings: {
    paymentNumbers: {
      "M-Pesa": "0793401886",
      "Airtel Money": "0692359311",
      "HaloPesa": "0613431930"
    },
    links: {
      "GAL Sport": "https://gsb.co.tz/",
      "Betika": "https://www.betika.co.tz/"
    }
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      return {
        odds: Array.isArray(saved.odds) ? saved.odds : clone(DEFAULT_DATA.odds),
        payments: Array.isArray(saved.payments) ? saved.payments : [],
        settings: {
          paymentNumbers: {
            ...DEFAULT_DATA.settings.paymentNumbers,
            ...(saved.settings && saved.settings.paymentNumbers ? saved.settings.paymentNumbers : {})
          },
          links: {
            ...DEFAULT_DATA.settings.links,
            ...(saved.settings && saved.settings.links ? saved.settings.links : {})
          }
        }
      };
    }
  } catch (error) {
    console.error("Imeshindwa kusoma data.json:", error.message);
  }
  return clone(DEFAULT_DATA);
}

let data = loadData();
const adminTokens = new Set();

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Imeshindwa kuhifadhi data.json:", error.message);
  }
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Ingia Admin kwanza." });
  }
  const token = auth.slice(7);
  if (!adminTokens.has(token)) {
    return res.status(401).json({ success: false, message: "Kikao cha Admin kimeisha. Ingia tena." });
  }
  next();
}

function cleanText(value, max = 160) {
  return String(value || "").trim().slice(0, max);
}

function safeUrl(value) {
  const raw = cleanText(value, 500);
  try {
    const parsed = new URL(raw);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, app: "YUSUPHU ODDS VIP" });
});

app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    price: VIP_PRICE,
    paymentMethods: Object.keys(data.settings.paymentNumbers)
  });
});

/* Customers can only fetch FREE odds through this public route. */
app.get("/api/odds", (req, res) => {
  res.json(data.odds.filter(item => item.type === "FREE"));
});

app.post("/api/payment", (req, res) => {
  const method = cleanText(req.body.method, 40);
  const phone = cleanText(req.body.phone, 30);
  const reference = cleanText(req.body.reference, 100);

  if (!Object.prototype.hasOwnProperty.call(data.settings.paymentNumbers, method)) {
    return res.status(400).json({ success: false, message: "Chagua mtandao wa malipo uliopo." });
  }
  if (!/^[+0-9 ()-]{9,20}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Weka namba yako ya simu iliyo sahihi." });
  }
  if (reference.length < 4) {
    return res.status(400).json({ success: false, message: "Weka Payment Reference kutoka SMS ya muamala." });
  }
  const duplicate = data.payments.some(p => p.reference.toLowerCase() === reference.toLowerCase());
  if (duplicate) {
    return res.status(409).json({ success: false, message: "Reference hii tayari imetumwa." });
  }

  const payment = {
    id: Date.now(),
    method,
    phone,
    reference,
    amount: VIP_PRICE,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };
  data.payments.unshift(payment);
  saveData();

  res.json({
    success: true,
    message: "Taarifa zimepokelewa. VIP itafunguliwa baada ya Admin kuthibitisha malipo.",
    payment: { id: payment.id, method: payment.method, reference: payment.reference, status: payment.status }
  });
});

app.get("/api/vip/access", (req, res) => {
  const phone = cleanText(req.query.phone, 30).replace(/\s/g, "");
  if (!phone) {
    return res.status(400).json({ success: false, message: "Weka namba ya simu uliyotumia kuomba VIP." });
  }
  const approved = data.payments.some(p =>
    p.status === "APPROVED" && String(p.phone).replace(/\s/g, "") === phone
  );
  if (!approved) {
    return res.json({ success: true, access: false, message: "VIP bado haijafunguliwa. Hakikisha Admin amethibitisha malipo." });
  }
  res.json({
    success: true,
    access: true,
    odds: data.odds.filter(item => item.type === "VIP")
  });
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body.password || "");
  if (!process.env.ADMIN_PASSWORD && ADMIN_PASSWORD === "BadilishaAdmin123!") {
    // The default is provided only to make initial setup easier; change it in Render.
  }
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: "Password ya Admin si sahihi." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  adminTokens.add(token);
  res.json({ success: true, token, message: "Umeingia Admin." });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  adminTokens.delete((req.headers.authorization || "").slice(7));
  res.json({ success: true });
});

app.get("/api/admin/data", requireAdmin, (req, res) => {
  res.json({
    success: true,
    odds: data.odds,
    payments: data.payments,
    settings: data.settings,
    vipPrice: VIP_PRICE
  });
});

app.post("/api/admin/odds", requireAdmin, (req, res) => {
  const match = cleanText(req.body.match, 160);
  const pick = cleanText(req.body.pick, 160);
  const odd = Number(req.body.odd);
  const type = cleanText(req.body.type, 10).toUpperCase();

  if (!match || !pick || !Number.isFinite(odd) || odd <= 1 || odd > 1000 || !["FREE", "VIP"].includes(type)) {
    return res.status(400).json({ success: false, message: "Jaza mechi, utabiri, odd sahihi, na aina ya FREE/VIP." });
  }

  const item = { id: Date.now(), match, pick, odd, type };
  data.odds.unshift(item);
  saveData();
  res.json({ success: true, message: "Odd imeongezwa.", odd: item });
});

app.put("/api/admin/odds/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const item = data.odds.find(o => o.id === id);
  if (!item) return res.status(404).json({ success: false, message: "Odd haijapatikana." });

  const match = cleanText(req.body.match, 160);
  const pick = cleanText(req.body.pick, 160);
  const odd = Number(req.body.odd);
  const type = cleanText(req.body.type, 10).toUpperCase();

  if (!match || !pick || !Number.isFinite(odd) || odd <= 1 || odd > 1000 || !["FREE", "VIP"].includes(type)) {
    return res.status(400).json({ success: false, message: "Taarifa za odd si sahihi." });
  }
  Object.assign(item, { match, pick, odd, type });
  saveData();
  res.json({ success: true, message: "Odd imehaririwa." });
});

app.delete("/api/admin/odds/:id", requireAdmin, (req, res) => {
  const before = data.odds.length;
  data.odds = data.odds.filter(o => o.id !== Number(req.params.id));
  if (data.odds.length === before) {
    return res.status(404).json({ success: false, message: "Odd haijapatikana." });
  }
  saveData();
  res.json({ success: true, message: "Odd imefutwa." });
});

app.patch("/api/admin/payments/:id", requireAdmin, (req, res) => {
  const payment = data.payments.find(p => p.id === Number(req.params.id));
  const status = cleanText(req.body.status, 20).toUpperCase();
  if (!payment) return res.status(404).json({ success: false, message: "Ombi la malipo halijapatikana." });
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return res.status(400).json({ success: false, message: "Hali ya malipo si sahihi." });
  }
  payment.status = status;
  payment.reviewedAt = new Date().toISOString();
  saveData();
  res.json({ success: true, message: "Hali ya malipo imesasishwa." });
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const incomingNumbers = req.body.paymentNumbers || {};
  const incomingLinks = req.body.links || {};

  for (const method of Object.keys(data.settings.paymentNumbers)) {
    if (incomingNumbers[method] !== undefined) {
      const number = cleanText(incomingNumbers[method], 30);
      if (!/^[+0-9 ()-]{9,20}$/.test(number)) {
        return res.status(400).json({ success: false, message: "Namba ya biashara si sahihi: " + method });
      }
      data.settings.paymentNumbers[method] = number;
    }
  }

  for (const brand of ["GAL Sport", "Betika"]) {
    if (incomingLinks[brand] !== undefined) {
      const url = safeUrl(incomingLinks[brand]);
      if (!url) return res.status(400).json({ success: false, message: "Kiungo si sahihi: " + brand });
      data.settings.links[brand] = url;
    }
  }

  saveData();
  res.json({ success: true, message: "Mipangilio imehifadhiwa." });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`YUSUPHU ODDS VIP running on port ${PORT}`);
});
