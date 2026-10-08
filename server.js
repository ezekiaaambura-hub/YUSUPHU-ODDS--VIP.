const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html na style.css zilizopo kwenye root
app.use(express.static(__dirname));

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "BADILISHA_PASSWORD_HAPA";

const PAYMENT_NUMBERS = {
  "M-Pesa": "0793401886",
  "Airtel Money": "0692359311",
  "HaloPesa": "0613431930"
};

const VIP_PRICE = 5000;


let odds = [
  {
    id: 1,
    match: "Arsenal vs Chelsea",
    pick: "Over 2.5",
    odd: 1.85,
    type: "VIP"
  },
  {
    id: 2,
    match: "Barcelona vs Sevilla",
    pick: "Barcelona Win",
    odd: 1.60,
    type: "VIP"
  },
  {
    id: 3,
    match: "Real Madrid vs Valencia",
    pick: "Both Teams To Score",
    odd: 1.75,
    type: "FREE"
  }
];

let payments = [];
const adminTokens = new Set();

function createToken() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Admin login inahitajika."
    });
  }

  const token = auth.substring(7);

  if (!adminTokens.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Admin session sio sahihi."
    });
  }

  next();
}

// HOME
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// HEALTH
app.get("/api/health", function (req, res) {
  res.json({
    success: true,
    app: "YUSUPHU ODDS VIP"
  });
});

// CONFIG
app.get("/api/config", function (req, res) {
  res.json({
    success: true,
    price: VIP_PRICE,
    paymentNumber: PAYMENT_NUMBER
  });
});

// GET ODDS
app.get("/api/odds", function (req, res) {
  res.json(odds);
});

app.post("/api/payment", function (req, res) {
  const reference = String(req.body.reference || "").trim();
  const method = String(req.body.method || "").trim();

  if (!method) {
    return res.status(400).json({
      success: false,
      message: "Chagua mtandao wa malipo."
    });
  }

  if (!PAYMENT_NUMBERS[method]) {
    return res.status(400).json({
      success: false,
      message: "Mtandao wa malipo sio sahihi."
    });
  }

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  const alreadyExists = payments.some(function (payment) {
    return (
      payment.reference.toLowerCase() ===
      reference.toLowerCase()
    );
  });

  if (alreadyExists) {
    return res.status(409).json({
      success: false,
      message: "Reference hii tayari imetumwa."
    });
  }

  const payment = {
    id: Date.now(),
    reference: reference,
    method: method,
    amount: VIP_PRICE,
    phone: PAYMENT_NUMBERS[method],
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  payments.unshift(payment);

  res.json({
    success: true,
    message:
      "Malipo yamepokelewa. Subiri Admin athibitishe.",
    payment: payment
  });
});

  

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  const alreadyExists = payments.some(function (payment) {
    return (
      payment.reference.toLowerCase() ===
      reference.toLowerCase()
    );
  });

  if (alreadyExists) {
    return res.status(409).json({
      success: false,
      message: "Reference hii tayari imetumwa."
    });
  }

  const payment = {
    id: Date.now(),
    reference: reference,
    amount: VIP_PRICE,
    phone: PAYMENT_NUMBER,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  payments.unshift(payment);

  res.json({
    success: true,
    message:
      "Malipo yamepokelewa. Subiri Admin athibitishe.",
    payment: payment
  });
});

// PAYMENT STATUS
app.get(
  "/api/payment-status/:reference",
  function (req, res) {
    const reference =
      String(req.params.reference || "").trim();

    const payment = payments.find(function (item) {
      return (
        item.reference.toLowerCase() ===
        reference.toLowerCase()
      );
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment Reference haijapatikana."
      });
    }

    let message =
      "Malipo bado yanasubiri uthibitisho wa Admin.";

    if (payment.status === "APPROVED") {
      message =
        "Malipo yamethibitishwa. VIP imefunguliwa.";
    }

    if (payment.status === "REJECTED") {
      message = "Malipo yamekataliwa.";
    }

    res.json({
      success: true,
      status: payment.status,
      message: message
    });
  }
);

// ADMIN LOGIN
app.post("/api/admin/login", function (req, res) {
  const password = String(req.body.password || "");

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Password sio sahihi."
    });
  }

  const token = createToken();

  adminTokens.add(token);

  res.json({
    success: true,
    token: token
  });
});

// ADMIN LOGOUT
app.post(
  "/api/admin/logout",
  requireAdmin,
  function (req, res) {
    const token =
      req.headers.authorization.substring(7);

    adminTokens.delete(token);

    res.json({
      success: true
    });
  }
);

// ADMIN PAYMENTS
app.get(
  "/api/admin/payments",
  requireAdmin,
  function (req, res) {
    res.json(payments);
  }
);

// APPROVE PAYMENT
app.post(
  "/api/admin/payments/:id/approve",
  requireAdmin,
  function (req, res) {
    const id = Number(req.params.id);

    const payment = payments.find(function (item) {
      return item.id === id;
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Malipo hayajapatikana."
      });
    }

    payment.status = "APPROVED";

    res.json({
      success: true,
      payment: payment
    });
  }
);

// REJECT PAYMENT
app.post(
  "/api/admin/payments/:id/reject",
  requireAdmin,
  function (req, res) {
    const id = Number(req.params.id);

    const payment = payments.find(function (item) {
      return item.id === id;
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Malipo hayajapatikana."
      });
    }

    payment.status = "REJECTED";

    res.json({
      success: true,
      payment: payment
    });
  }
);

// ADD ODDS
app.post(
  "/api/admin/odds",
  requireAdmin,
  function (req, res) {
    const match = String(req.body.match || "").trim();
    const pick = String(req.body.pick || "").trim();
    const odd = Number(req.body.odd);

    const type =
      String(req.body.type || "VIP").toUpperCase();

    if (
      !match ||
      !pick ||
      !Number.isFinite(odd) ||
      odd <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Jaza Match, Pick na Odd kwa usahihi."
      });
    }

    const newOdd = {
      id: Date.now(),
      match: match,
      pick: pick,
      odd: odd,
      type: type === "FREE" ? "FREE" : "VIP"
    };

    odds.unshift(newOdd);

    res.status(201).json({
      success: true,
      item: newOdd
    });
  }
);

// DELETE ODDS
app.delete(
  "/api/admin/odds/:id",
  requireAdmin,
  function (req, res) {
    const id = Number(req.params.id);

    const oldLength = odds.length;

    odds = odds.filter(function (item) {
      return item.id !== id;
    });

    if (odds.length === oldLength) {
      return res.status(404).json({
        success: false,
        message: "Odd haijapatikana."
      });
    }

    res.json({
      success: true
    });
  }
);

// START SERVER
app.listen(PORT, "0.0.0.0", function () {
  console.log(
    "YUSUPHU ODDS VIP running on port " + PORT
  );
});
