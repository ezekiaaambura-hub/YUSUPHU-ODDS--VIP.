
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "YUSUPHU2026";
const DATABASE_URL = process.env.DATABASE_URL;

if (!ADMIN_PASSWORD) {
  throw new Error("ADMIN_PASSWORD haijawekwa.");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL haijawekwa kwenye Render.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");

const initial = () => ({
  payments: [],
  odds: [
    { id: 1, match: "Manchester United", pick: "Double Chance", odd: 1.50, type: "FREE" },
    { id: 2, match: "Barcelona", pick: "Over 1.5 Goals", odd: 1.50, type: "FREE" },
    { id: 3, match: "Real Madrid", pick: "To Win", odd: 1.60, type: "FREE" }
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

function normalizeStore(old) {
  const defaults = initial();
  old = old && typeof old === "object" ? old : {};

  return {
    payments: Array.isArray(old.payments)
      ? old.payments.map(p => ({
          ...p,
          status: String(p.status || "PENDING").toUpperCase()
        }))
      : [],
    odds: normalizeOdds(
      Array.isArray(old.odds) ? old.odds : defaults.odds
    ),
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
}

function loadLocalStore() {
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(dataFile)) {
    return initial();
  }

  const old = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  return normalizeStore(old);
}

let store;
const adminTokens = new Map();

async function initializeStore() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS yusuphu_app_store (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const result = await pool.query(
    "SELECT data FROM yusuphu_app_store WHERE id = 1"
  );

  if (result.rows.length > 0) {
    store = normalizeStore(result.rows[0].data);
    console.log("Data ya YUSUPHU ODDS VIP imepakiwa kutoka Neon.");
    return;
  }

  // Jaribu kuhamisha data ya zamani ikiwa faili bado ipo.
  let oldData;

  try {
    oldData = loadLocalStore();
  } catch (error) {
    console.error("Imeshindwa kusoma data ya zamani:", error.message);
    throw error;
  }

  store = normalizeStore(oldData);

  await pool.query(
    `INSERT INTO yusuphu_app_store (id, data)
     VALUES (1, $1::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [JSON.stringify(store)]
  );

  const check = await pool.query(
    "SELECT data FROM yusuphu_app_store WHERE id = 1"
  );

  store = normalizeStore(check.rows[0].data);
  console.log("Data ya YUSUPHU ODDS VIP imeanzishwa kwenye Neon.");
}

async function save() {
  if (!store) throw new Error("Data haijapakiwa.");

  await pool.query(
    `INSERT INTO yusuphu_app_store (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(store)]
  );
}

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
    message: "YUSUPHU ODDS VIP iko Live.",
    database: "Neon PostgreSQL"
  });
});

app.get("/api/odds", (req, res) => {
  res.json(store.odds.filter(o => o.type === "FREE"));
});

app.get("/api/config", (req, res) => {
  res.json({
    success: true,
    paymentNumbers: store.settings.paymentNumbers
  });
});

// CUSTOMER PAYMENT
app.post("/api/payment", async (req, res) => {
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

    if (store.payments.some(
      p => String(p.reference).toLowerCase() === reference.toLowerCase()
    )) {
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
    await save();

    res.json({
      success: true,
      message: "Malipo yamepokelewa. Subiri Admin athibitishe.",
      payment
    });
  } catch (error) {
    adminError(res, error);
  }
});

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

  res.json({ success: true, token, message: "Umeingia Admin." });
});

app.post("/api/admin/logout", auth, (req, res) => {
  const token = String(req.headers.authorization || "").slice(7);
  adminTokens.delete(token);
  res.json({ success: true, message: "Umetoka kwenye Admin." });
});

app.get("/api/admin/data", auth, (req, res) => {
  res.json({
    success: true,
    odds: store.odds,
    payments: store.payments,
    settings: store.settings
  });
});

app.get("/api/admin/payments", auth, (req, res) => {
  res.json({ success: true, payments: store.payments });
});

app.patch("/api/admin/payments/:id", auth, async (req, res) => {
  try {
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
    await save();

    res.json({
      success: true,
      message: "Hali ya malipo imebadilishwa.",
      payment
    });
  } catch (error) {
    adminError(res, error);
  }
});

app.post("/api/admin/payments/:id/approve", auth, async (req, res) => {
  try {
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
    await save();

    res.json({ success: true, payment });
  } catch (error) {
    adminError(res, error);
  }
});

app.post("/api/admin/payments/:id/reject", auth, async (req, res) => {
  try {
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
    await save();

    res.json({ success: true, payment });
  } catch (error) {
    adminError(res, error);
  }
});

// ADD ODDS
app.post("/api/admin/odds", auth, async (req, res) => {
  try {
    const match = String(req.body.match || "").trim();
    const pick = String(req.body.pick || req.body.prediction || "").trim();
    const odd = Number(req.body.odd);
    const type = String(req.body.type || "FREE").toUpperCase();

    if (!match || !pick || !Number.isFinite(odd) ||
        odd <= 1 || !["FREE", "VIP"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Weka mechi, utabiri, odd na aina sahihi."
      });
    }

    const item = { id: Date.now(), match, pick, odd, type };
    store.odds.unshift(item);
    await save();

    res.json({ success: true, message: "Odd imeongezwa.", odd: item });
  } catch (error) {
    adminError(res, error);
  }
});

app.get("/api/admin/odds", auth, (req, res) => {
  res.json({ success: true, odds: store.odds });
});

app.put("/api/admin/odds/:id", auth, async (req, res) => {
  try {
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

    if (!match || !pick || !Number.isFinite(odd) ||
        odd <= 1 || !["FREE", "VIP"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Taarifa za odd si sahihi."
      });
    }

    Object.assign(item, { match, pick, odd, type });
    await save();

    res.json({ success: true, message: "Odd imehaririwa.", odd: item });
  } catch (error) {
    adminError(res, error);
  }
});

app.delete("/api/admin/odds/:id", auth, async (req, res) => {
  try {
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
    await save();

    res.json({ success: true, message: "Odd imefutwa." });
  } catch (error) {
    adminError(res, error);
  }
});

// ADMIN SETTINGS
app.put("/api/admin/settings", auth, async (req, res) => {
  try {
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

    await save();

    res.json({
      success: true,
      message: "Mipangilio imehifadhiwa."
    });
  } catch (error) {
    adminError(res, error);
  }
});
// API-FOOTBALL: CACHE YA MECHI
const footballFixturesCache = new Map();

// PATA MECHI RASMI KWA TAREHE (ADMIN PEKEE)
app.get("/api/admin/football/fixtures", auth, async (req, res) => {
  try {
    const apiKey = process.env.API_FOOTBALL_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "API_FOOTBALL_KEY haijawekwa kwenye Render."
      });
    }

    const date = String(req.query.date || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Weka tarehe kwa mfumo YYYY-MM-DD."
      });
    }

    const cached = footballFixturesCache.get(date);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json({
        success: true,
        cached: true,
        date,
        fixtures: cached.fixtures
      });
    }

    const url = new URL(
      "https://v3.football.api-sports.io/fixtures"
    );

    url.searchParams.set("date", date);
    url.searchParams.set("timezone", "Africa/Dar_es_Salaam");

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: "API-Football haikujibu kwa mafanikio."
      });
    }

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("API-Football errors:", data.errors);

      return res.status(502).json({
        success: false,
        message: "API-Football imerudisha hitilafu. Kagua mipangilio."
      });
    }

    const fixtures = (data.response || []).map(f => ({
      fixtureId: f.fixture.id,
      date: f.fixture.date,
      status: f.fixture.status.short,
      leagueId: f.league.id,
      league: f.league.name,
      country: f.league.country,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeGoals: f.goals.home,
      awayGoals: f.goals.away
    }));

    footballFixturesCache.set(date, {
      fixtures,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    res.json({
      success: true,
      cached: false,
      date,
      count: fixtures.length,
      fixtures
    });
  } catch (error) {
    console.error("Football fixtures error:", error.message);

    res.status(500).json({
      success: false,
      message: "Imeshindikana kupata mechi. Jaribu tena baadaye."
    });
  }
});
async function start() {
  try {
    await initializeStore();

    app.listen(PORT, "0.0.0.0", () => {
      console.log("YUSUPHU ODDS VIP running on port " + PORT);
    });
  } catch (error) {
    console.error("Imeshindwa kuanzisha YUSUPHU ODDS VIP:", error);
    process.exit(1);
  }
}

start();
