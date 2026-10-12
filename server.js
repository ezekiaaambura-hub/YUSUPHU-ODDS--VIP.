
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;
const APP_NAME = "YUSUPHU ODDS VIP";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "badilisha-hii-kabla-ya-kwenda-live";

const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", 1);

app.use(session({
  name: "yusuphu.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000
  }
}));

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const saved = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      return {
        odds: Array.isArray(saved.odds) ? saved.odds : [],
        payments: Array.isArray(saved.payments)
          ? saved.payments : [],
        nextOddId: Number(saved.nextOddId) || 1,
        nextPaymentId: Number(saved.nextPaymentId) || 1
      };
    }
  } catch (error) {
    console.error("Data error:", error.message);
  }

  return {
    odds: [],
    payments: [],
    nextOddId: 1,
    nextPaymentId: 1
  };
}

const data = loadData();

function saveData() {
  const tempFile = DATA_FILE + ".tmp";

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2)
  );

  fs.renameSync(tempFile, DATA_FILE);
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin === true) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Ingia kwanza kama Admin."
  });
}

// HOME / HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: APP_NAME,
    status: "ok"
  });
});

// PAYMENT CONFIGURATION
app.get("/api/config", (req, res) => {
  res.json({
    appName: APP_NAME,
    price: 5000,
    paymentNumbers: {
      "M-Pesa": "0793401886",
      "Airtel Money": "0692359311",
      "HaloPesa": "0613431930"
    },
    bettingLinks: {
      Betika: "https://www.betika.com/",
      GalSport: "https://galsportsbet.com/"
    }
  });
});

// SHOW FREE OR VIP ODDS
app.get("/api/odds", (req, res) => {
  const type = String(req.query.type || "").toLowerCase();

  if (!["free", "vip"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Chagua free au vip."
    });
  }

  const odds = data.odds.filter(
    item => item.type === type
  );

  res.json({
    success: true,
    odds
  });
});

// SUBMIT PAYMENT REFERENCE
app.post("/api/payment", (req, res) => {
  const method = String(req.body.method || "").trim();
  const reference = String(
    req.body.reference || ""
  ).trim();

  const allowedMethods = [
    "M-Pesa",
    "Airtel Money",
    "HaloPesa"
  ];

  if (!allowedMethods.includes(method)) {
    return res.status(400).json({
      success: false,
      message: "Chagua mtandao wa malipo."
    });
  }

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  const payment = {
    id: data.nextPaymentId++,
    name: String(req.body.name || "").trim(),
    phone: String(req.body.phone || "").trim(),
    method,
    reference,
    amount: 5000,
    status: "PENDING",
    submittedAt: new Date().toISOString()
  };

  data.payments.unshift(payment);
  saveData();

  res.status(201).json({
    success: true,
    message:
      "Ombi limepokelewa. Malipo yanasubiri kukaguliwa.",
    paymentId: payment.id
  });
});

// ADMIN LOGIN
app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      success: false,
      message: "Weka ADMIN_PASSWORD kwenye Render."
    });
  }

  if (String(req.body.password || "") !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Password si sahihi."
    });
  }

  req.session.isAdmin = true;

  req.session.save(error => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Imeshindikana kuingia."
      });
    }

    res.json({
      success: true,
      message: "Umeingia kama Admin."
    });
  });
});

// CHECK ADMIN SESSION
app.get("/api/admin/me", (req, res) => {
  res.json({
    success: true,
    isAdmin: !!req.session.isAdmin
  });
});

// ADMIN LOGOUT
app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("yusuphu.sid");

    res.json({
      success: true,
      message: "Umetoka kwenye Admin."
    });
  });
});

// VIEW PAYMENTS
app.get(
  "/api/admin/payments",
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      payments: data.payments
    });
  }
);

// APPROVE PAYMENT
app.post(
  "/api/admin/payments/:id/approve",
  requireAdmin,
  (req, res) => {
    const payment = data.payments.find(
      item => item.id === Number(req.params.id)
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Malipo hayajapatikana."
      });
    }

    payment.status = "APPROVED";
    payment.reviewedAt = new Date().toISOString();

    saveData();

    res.json({
      success: true,
      message: "Malipo yameidhinishwa.",
      payment
    });
  }
);

// REJECT PAYMENT
app.post(
  "/api/admin/payments/:id/reject",
  requireAdmin,
  (req, res) => {
    const payment = data.payments.find(
      item => item.id === Number(req.params.id)
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Malipo hayajapatikana."
      });
    }

    payment.status = "REJECTED";
    payment.reviewedAt = new Date().toISOString();

    saveData();

    res.json({
      success: true,
      message: "Malipo yamekataliwa.",
      payment
    });
  }
);

// ADD ODDS
app.post("/api/admin/odds", requireAdmin, (req, res) => {
  const match = String(req.body.match || "").trim();
  const prediction = String(
    req.body.prediction || req.body.pick || ""
  ).trim();
  const odd = Number(req.body.odd);
  const type = String(req.body.type || "free").toLowerCase();

  if (
    !match ||
    !prediction ||
    !Number.isFinite(odd) ||
    odd <= 1 ||
    !["free", "vip"].includes(type)
  ) {
    return res.status(400).json({
      success: false,
      message: "Jaza mechi, prediction, odd na aina sahihi."
    });
  }

  const item = {
    id: data.nextOddId++,
    match,
    prediction,
    odd,
    type,
    createdAt: new Date().toISOString()
  };

  data.odds.unshift(item);
  saveData();

  res.status(201).json({
    success: true,
    message: "Odd imeongezwa.",
    odd: item
  });
});

// DELETE ODDS
app.delete(
  "/api/admin/odds/:id",
  requireAdmin,
  (req, res) => {
    const index = data.odds.findIndex(
      item => item.id === Number(req.params.id)
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Odd haijapatikana."
      });
    }

    data.odds.splice(index, 1);
    saveData();

    res.json({
      success: true,
      message: "Odd imefutwa."
    });
  }
);

// HOME PAGE
app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// UNKNOWN API ROUTES
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route haijapatikana."
  });
});

// START SERVER — MARA MOJA TU
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    APP_NAME + " running on port " + PORT
  );
});
