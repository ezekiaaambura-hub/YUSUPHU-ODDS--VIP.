const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 10000;
const PAYMENT_PHONE = process.env.PAYMENT_PHONE || "0793401886";
const VIP_PRICE = Number(process.env.VIP_PRICE || 5000);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "CHANGE_ME_NOW";

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map();

async function db(sql, params = []) {
  if (!pool) throw new Error("DATABASE_URL is not configured");
  return pool.query(sql, params);
}

async function initDb() {
  if (!pool) return;
  await db(`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      reference TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS odds (
      id SERIAL PRIMARY KEY,
      match TEXT NOT NULL,
      market TEXT NOT NULL,
      selection TEXT NOT NULL,
      odd NUMERIC(10,2) NOT NULL,
      analysis TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions.has(token) || sessions.get(token) !== "admin") {
    return res.status(401).json({ error: "Admin login required" });
  }
  next();
}

app.get("/api/config", (req, res) => {
  res.json({ paymentPhone: PAYMENT_PHONE, vipPrice: VIP_PRICE });
});

app.post("/api/payments", async (req, res) => {
  try {
    const { name, phone, reference } = req.body;
    if (!name || !phone || !reference) {
      return res.status(400).json({ error: "Jaza jina, namba ya simu na transaction reference." });
    }
    if (!pool) {
      return res.status(503).json({ error: "Database haijaunganishwa bado." });
    }
    const result = await db(
      `INSERT INTO payments (name, phone, reference, amount) VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
      [name.trim(), phone.trim(), reference.trim(), VIP_PRICE]
    );
    res.json({
      ok: true,
      message: "Ombi la malipo limepokelewa. Admin atathibitisha malipo yako.",
      paymentId: result.rows[0].id
    });
  } catch (e) {
    res.status(500).json({ error: "Imeshindikana kutuma ombi la malipo." });
  }
});

app.post("/api/vip/unlock", async (req, res) => {
  try {
    const { phone, reference } = req.body;
    if (!phone || !reference) return res.status(400).json({ error: "Weka namba ya simu na transaction reference." });
    const result = await db(
      `SELECT id, name, phone, status FROM payments WHERE phone=$1 AND reference=$2 ORDER BY id DESC LIMIT 1`,
      [phone.trim(), reference.trim()]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Malipo hayajapatikana." });
    if (result.rows[0].status !== "approved") {
      return res.status(403).json({ error: "Malipo bado hayajaidhinishwa na admin." });
    }
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, `customer:${result.rows[0].phone}`);
    res.json({ ok: true, token, name: result.rows[0].name });
  } catch (e) {
    res.status(500).json({ error: "Tatizo la server/database." });
  }
});

app.get("/api/vip/odds", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !sessions.get(token)?.startsWith("customer:")) {
      return res.status(401).json({ error: "VIP imefungwa. Thibitisha malipo kwanza." });
    }
    const result = await db(`SELECT * FROM odds WHERE status='published' ORDER BY id DESC`);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: "Imeshindikana kupata odds." });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Password si sahihi." });
  }
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, "admin");
  res.json({ ok: true, token });
});

app.get("/api/admin/payments", requireAdmin, async (req, res) => {
  const result = await db(`SELECT * FROM payments ORDER BY id DESC`);
  res.json(result.rows);
});

app.post("/api/admin/payments/:id/approve", requireAdmin, async (req, res) => {
  await db(`UPDATE payments SET status='approved' WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

app.post("/api/admin/payments/:id/reject", requireAdmin, async (req, res) => {
  await db(`UPDATE payments SET status='rejected' WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/admin/odds", requireAdmin, async (req, res) => {
  const result = await db(`SELECT * FROM odds ORDER BY id DESC`);
  res.json(result.rows);
});

app.post("/api/admin/odds", requireAdmin, async (req, res) => {
  const { match, market, selection, odd, analysis } = req.body;
  if (!match || !market || !selection || !odd) {
    return res.status(400).json({ error: "Jaza taarifa zote za odd." });
  }
  const result = await db(
    `INSERT INTO odds (match, market, selection, odd, analysis) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [match, market, selection, Number(odd), analysis || ""]
  );
  res.json(result.rows[0]);
});

app.delete("/api/admin/odds/:id", requireAdmin, async (req, res) => {
  await db(`DELETE FROM odds WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

app.get("/health", (req, res) => res.json({ status: "ok", app: "YUSUPHU ODDS VIP" }));

initDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => console.log(`YUSUPHU ODDS VIP running on ${PORT}`));
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
