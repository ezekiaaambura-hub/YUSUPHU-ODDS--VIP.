const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// SETTINGS
// ===============================

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ||Yusuphu2026

const PAYMENT_NUMBERS = {
  "M-Pesa": "0793401886",
  "Airtel Money": "0692359311",
  "HaloPesa": "0613441930"
};

const PAYMENT_NUMBER = PAYMENT_NUMBERS["M-Pesa"];
const VIP_PRICE = 5000;


// ===============================
// DATA
// ===============================

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
    Math.random().toString(36).substring(2) +
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
      message: "Admin session imeisha."
    });
  }

  next();
}

// ===============================
// API HEALTH
// ===============================

app.get("/api/health", function (req, res) {
  res.json({
    success: true,
    app: "YUSUPHU ODDS VIP"
  });
});

// ===============================
// CONFIG
// ===============================

app.get("/api/config", function (req, res) {
  res.json({
    success: true,
    price: VIP_PRICE,
    paymentNumber: PAYMENT_NUMBER
  });
});

// ===============================
// ODDS
// ===============================

app.get("/api/odds", function (req, res) {
  res.json(odds);
});

// ===============================
// PAYMENT
// ===============================

app.post("/api/payment", function (req, res) {
  const reference = String(req.body.reference || "").trim();

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  const exists = payments.some(function (payment) {
    return (
      payment.reference.toLowerCase() ===
      reference.toLowerCase()
    );
  });

  if (exists) {
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

// ===============================
// PAYMENT STATUS
// ===============================

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

// ===============================
// ADMIN LOGIN
// ===============================

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

// ===============================
// ADMIN LOGOUT
// ===============================

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

// ===============================
// ADMIN PAYMENTS
// ===============================

app.get(
  "/api/admin/payments",
  requireAdmin,
  function (req, res) {
    res.json(payments);
  }
);

// ===============================
// APPROVE PAYMENT
// ===============================

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

// ===============================
// REJECT PAYMENT
// ===============================

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

// ===============================
// ADD ODDS
// ===============================

app.post(
  "/api/admin/odds",
  requireAdmin,
  function (req, res) {
    const match =
      String(req.body.match || "").trim();

    const pick =
      String(req.body.pick || "").trim();

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

// ===============================
// DELETE ODDS
// ===============================

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

// =====================================================
// WEBSITE
// =====================================================

const html = `
<!DOCTYPE html>
<html lang="sw">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0">

<title>YUSUPHU ODDS VIP</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #061426;
  color: white;
}

button,
input,
select {
  font: inherit;
}

.hero {
  background: linear-gradient(
    135deg,
    #087cff,
    #1164e8
  );

  text-align: center;
  padding: 30px 15px;
}

.hero-title {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 40px;
  font-weight: 900;
}

.hero p {
  font-size: 20px;
  font-weight: bold;
}

.navigation {
  background: #0b1728;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.navigation button {
  border: none;
  border-radius: 15px;
  padding: 17px 8px;
  font-weight: 900;
  background: #f5f6f8;
  color: #101b2b;
  cursor: pointer;
}

main {
  max-width: 1000px;
  margin: auto;
  padding: 20px;
}

.page {
  display: none;
}

.page.active {
  display: block;
}

.card {
  background: linear-gradient(
    145deg,
    #123554,
    #082443
  );

  border: 1px solid #15558c;
  border-radius: 22px;
  padding: 30px;
  margin-bottom: 18px;
  box-shadow: 0 8px 25px #0005;
}

.green-title {
  color: #19e68b;
  font-size: 24px;
  font-weight: 900;
}

h1 {
  font-size: 60px;
  line-height: 1;
  margin: 20px 0;
}

h2 {
  font-size: 30px;
}

.card p {
  color: #d7e5f4;
  font-size: 20px;
  line-height: 1.4;
}

.green-button,
.blue-button {
  border: none;
  border-radius: 14px;
  padding: 17px 25px;
  font-weight: 900;
  cursor: pointer;
  margin-top: 10px;
}

.green-button {
  background: #19df83;
  color: #03170d;
}

.blue-button {
  background: #087cff;
  color: white;
}

.phone-number {
  font-size: 45px;
  font-weight: 900;
  margin: 20px 0;
}

.amount {
  color: #19e68b;
  font-size: 48px;
  font-weight: 900;
}

input,
select {
  width: 100%;
  padding: 16px;
  margin: 8px 0 12px;
  border-radius: 12px;
  border: 1px solid #58728d;
  background: #06182b;
  color: white;
}

.odd-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  background: #102d4b;
  border-radius: 17px;
  padding: 20px;
  margin: 12px 0;
}

.odd-number {
  color: #19e68b;
  font-size: 30px;
  font-weight: 900;
}

.warning {
  background: #102d4b;
  border-radius: 18px;
  padding: 20px;
  margin-top: 15px;
  line-height: 1.5;
}

.success {
  background: #087044;
  padding: 14px;
  border-radius: 10px;
  margin-top: 12px;
}

.error {
  background: #812536;
  padding: 14px;
  border-radius: 10px;
  margin-top: 12px;
}

.admin-item {
  background: #102d4b;
  padding: 16px;
  border-radius: 12px;
  margin: 10px 0;
}

.admin-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.small-button {
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-weight: bold;
}

.approve {
  background: #19df83;
}

.reject,
.delete {
  background: #ef4f61;
  color: white;
}

footer {
  background: #030b15;
  text-align: center;
  padding: 30px;
  color: #a8bbcf;
}

@media(max-width: 650px) {

  .hero-title {
    font-size: 30px;
  }

  .hero p {
    font-size: 15px;
  }

  .navigation {
    grid-template-columns: repeat(2, 1fr);
  }

  .navigation button {
    font-size: 14px;
  }

  main {
    padding: 14px;
  }

  .card {
    padding: 22px;
  }

  h1 {
    font-size: 47px;
  }

  .phone-number {
    font-size: 33px;
  }

}

</style>

</head>

<body>

<header class="hero">

  <div class="hero-title">
    <span>⚽</span>
    <span>YUSUPHU ODDS VIP</span>
  </div>

  <p>
    Free Odds • VIP TSh 5,000 • Bet Slip Calculator
  </p>

</header>

<nav class="navigation">

  <button onclick="showPage('home')">
    🏠 HOME
  </button>

  <button onclick="showPage('free')">
    🆓 FREE ODDS
  </button>

  <button onclick="showPage('vip')">
    ⭐ VIP
  </button>

  <button onclick="showPage('mkeka')">
    🎟️ MKEKA
  </button>

  <button onclick="showPage('payment')">
    💳 LIPA 5,000
  </button>

  <button onclick="showPage('admin')">
    🔐 ADMIN
  </button>

</nav>

<main>

<section id="home" class="page active">

  <div class="card">

    <div class="green-title">
      VIP FOOTBALL PREDICTIONS
    </div>

    <h1>
      Karibu<br>
      YUSUPHU ODDS VIP
    </h1>

    <p>
      Jiunge na huduma ya VIP Odds
      kwa <strong>TSh 5,000.</strong>
    </p>

    <button
      class="green-button"
      onclick="showPage('payment')">

      💳 LIPA TSh 5,000

    </button>

  </div>

  <div class="card">

    <h2>💳 JINSI YA KULIPA</h2>

    <p>
      Lipa TSh 5,000 kwenda kwenye namba:
    </p>

    <div class="phone-number">
      📱 0793401886
    </div>

    <p>
      Baada ya kufanya malipo,
      utapokea
      <strong>Reference/Transaction ID</strong>
      kupitia SMS.
    </p>

    <button
      class="green-button"
      onclick="showPage('payment')">

      ✅ NIMEFANYA MALIPO

    </button>

  </div>

  <div class="card">

    <h2>🆓 FREE ODDS</h2>

    <p>
      Angalia baadhi ya odds bure
      kabla ya kujiunga na VIP.
    </p>

    <button
      class="blue-button"
      onclick="showPage('free')">

      ANGALIA FREE ODDS

    </button>

  </div>

  <div class="warning">

    🔞 <strong>18+</strong> •
    Usibeti zaidi ya uwezo wako.
    Bet responsibly.

  </div>

</section>

<section id="free" class="page">

  <h2>🆓 FREE ODDS</h2>

  <div id="freeOdds"></div>

</section>

<section id="vip" class="page">

  <h2>⭐ VIP ODDS</h2>

  <div class="card">

    <p>
      Weka Payment Reference yako
      ili kuangalia hali ya malipo.
    </p>

    <input
      id="vipReference"
      placeholder="Payment Reference">

    <button
      class="green-button"
      onclick="checkVIP()">

      🔓 ANGALIA VIP

    </button>

    <div id="vipMessage"></div>

  </div>

  <div id="vipOdds"></div>

</section>

<section id="mkeka" class="page">

  <h2>🎟️ MKEKA</h2>

  <div class="card">

    <p>Bet Slip Calculator</p>

    <div id="slip"></div>

    <h2>
      Total Odds:
      <span id="totalOdds">1.00</span>
    </h2>

  </div>

</section>

<section id="payment" class="page">

  <h2>💳 LIPA TSh 5,000</h2>

  <div class="card">

    <h2>💳 JINSI YA KULIPA</h2>

    <p>Lipa:</p>

    <div class="amount">
      TSh 5,000
    </div>

    <p>Tuma kwenda:</p>

    <div class="phone-number">
      📱 0793401886
    </div>

    <hr>

    <h3>
      🧾 Payment Reference
    </h3>

    <p>
      Weka Reference/Transaction ID
      kutoka kwenye SMS yako.
    </p>

    <input
      id="paymentReference"
      placeholder="Weka Payment Reference">

    <button
      class="green-button"
      onclick="submitPayment()">

      ✅ NIMEFANYA MALIPO

    </button>

    <div id="paymentMessage"></div>

  </div>

</section>

<section id="admin" class="page">

  <h2>🔐 ADMIN</h2>

  <div class="card" id="loginBox">

    <h2>Admin Login</h2>

    <input
      type="password"
      id="adminPassword"
      placeholder="Admin Password">

    <button
      class="blue-button"
      onclick="adminLogin()">

      🔐 INGIA ADMIN

    </button>

    <div id="adminMessage"></div>

  </div>

  <div id="adminPanel" style="display:none">

    <div class="card">

      <h2>➕ ONGEZA ODDS</h2>

      <input
        id="match"
        placeholder="Mfano: Arsenal vs Chelsea">

      <input
        id="pick"
        placeholder="Mfano: Over 2.5">

      <input
        id="odd"
        type="number"
        step="0.01"
        placeholder="Odd mfano 1.85">

      <select id="oddType">

        <option value="VIP">VIP</option>

        <option value="FREE">FREE</option>

      </select>

      <button
        class="green-button"
        onclick="addOdd()">

        ➕ ONGEZA ODD

      </button>

      <div id="addMessage"></div>

    </div>

    <div class="card">

      <h2>⚽ ODDS ZILIZOPO</h2>

      <div id="adminOdds"></div>

    </div>

    <div class="card">

      <h2>💰 MALIPO</h2>

      <div id="adminPayments"></div>

    </div>

    <button
      class="blue-button"
      onclick="logout()">

      🚪 LOGOUT

    </button>

  </div>

</section>

</main>

<footer>

  <strong>YUSUPHU ODDS VIP</strong>

  <p>© 2026 • Football Predictions</p>

  <p>🔞 18+ Bet Responsibly</p>

</footer>

<script>

var adminToken =
  localStorage.getItem("yusuphuAdminToken") || "";

function showPage(id) {

  var pages =
    document.querySelectorAll(".page");

  pages.forEach(function(page) {
    page.classList.remove("active");
  });

  var selected =
    document.getElementById(id);

  if (selected) {
    selected.classList.add("active");
  }

  window.scrollTo(0, 0);

  if (id === "free") {
    loadFreeOdds();
  }

  if (id === "mkeka") {
    loadSlip();
  }

  if (id === "admin" && adminToken) {
    loadAdmin();
  }
}

function escapeHTML(value) {

  return String(value).replace(
    /[&<>"']/g,
    function(char) {

      var map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return map[char];
    }
  );
}

async function loadFreeOdds() {

  var box =
    document.getElementById("freeOdds");

  try {

    var response =
      await fetch("/api/odds");

    var data =
      await response.json();

    var free =
      data.filter(function(item) {
        return item.type === "FREE";
      });

    if (!free.length) {

      box.innerHTML =
        '<div class="card">' +
        '<h2>Hakuna Free Odds</h2>' +
        '<p>Admin hajaweka Free Odds bado.</p>' +
        '</div>';

      return;
    }

    box.innerHTML =
      free.map(function(item) {

        return (
          '<div class="odd-card">' +
          '<div>' +
          '<strong>' +
          escapeHTML(item.match) +
          '</strong><br>' +
          escapeHTML(item.pick) +
          '</div>' +
          '<div class="odd-number">' +
          Number(item.odd).toFixed(2) +
          '</div>' +
          '</div>'
        );

      }).join("");

  } catch (error) {

    box.innerHTML =
      '<div class="card">' +
      'Imeshindikana kupata odds.' +
      '</div>';
  }
}

async function submitPayment() {

  var input =
    document.getElementById(
      "paymentReference"
    );

  var message =
    document.getElementById(
      "paymentMessage"
    );

  var reference =
    input.value.trim();

  if (!reference) {

    message.innerHTML =
      '<p class="error">' +
      'Weka Payment Reference.' +
      '</p>';

    return;
  }

  try {

    var response =
      await fetch(
        "/api/payment",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            reference: reference
          })
        }
      );

    var data =
      await response.json();

    if (!response.ok) {

      message.innerHTML =
        '<p class="error">' +
        escapeHTML(data.message) +
        '</p>';

      return;
    }

    message.innerHTML =
      '<p class="success">' +
      escapeHTML(data.message) +
      '</p>';

  } catch (error) {

    message.innerHTML =
      '<p class="error">' +
      'Server haijapatikana.' +
      '</p>';
  }
}

async function checkVIP() {

  var reference =
    document.getElementById(
      "vipReference"
    ).value.trim();

  var message =
    document.getElementById(
      "vipMessage"
    );

  var box =
    document.getElementById(
      "vipOdds"
    );

  if (!reference) {

    message.innerHTML =
      '<p class="error">' +
      'Weka Payment Reference.' +
      '</p>';

    return;
  }

  try {

    var response =
      await fetch(
        "/api/payment-status/" +
        encodeURIComponent(reference)
      );

    var data =
      await response.json();

    if (!response.ok) {

      message.innerHTML =
        '<p class="error">' +
        escapeHTML(data.message) +
        '</p>';

      box.innerHTML = "";

      return;
    }

    if (data.status !== "APPROVED") {

      message.innerHTML =
        '<p class="error">' +
        escapeHTML(data.message) +
        '</p>';

      box.innerHTML = "";

      return;
    }

    message.innerHTML =
      '<p class="success">' +
      'Malipo yamethibitishwa. VIP imefunguliwa.' +
      '</p>';

    var oddsResponse =
      await fetch("/api/odds");

    var oddsData =
      await oddsResponse.json();

    var vip =
      oddsData.filter(function(item) {
        return item.type === "VIP";
      });

    box.innerHTML =
      vip.map(function(item) {

        return (
          '<div class="odd-card">' +
          '<div>' +
          '<strong>' +
          escapeHTML(item.match) +
          '</strong><br>' +
          escapeHTML(item.pick) +
          '</div>' +
          '<div class="odd-number">' +
          Number(item.odd).toFixed(2) +
          '</div>' +
          '</div>'
        );

      }).join("");

  } catch (error) {

    message.innerHTML =
      '<p class="error">' +
      'Tatizo la server.' +
      '</p>';
  }
}

async function adminLogin() {

  var password =
    document.getElementById(
      "adminPassword"
    ).value;

  var message =
    document.getElementById(
      "adminMessage"
    );

  if (!password) {

    message.innerHTML =
      '<p class="error">' +
      'Weka Admin Password.' +
      '</p>';

    return;
  }

  try {

    var response =
      await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            password: password
          })
        }
      );

    var data =
      await response.json();

    if (!response.ok) {

      message.innerHTML =
        '<p class="error">' +
        escapeHTML(data.message) +
        '</p>';

      return;
    }

    adminToken = data.token;

    localStorage.setItem(
      "yusuphuAdminToken",
      adminToken
    );

    document.getElementById(
      "loginBox"
    ).style.display = "none";

    document.getElementById(
      "adminPanel"
    ).style.display = "block";

    loadAdmin();

  } catch (error) {

    message.innerHTML =
      '<p class="error">' +
      'Server haijapatikana.' +
      '</p>';
  }
}

async function adminFetch(url, options) {

  options = options || {};

  options.headers = options.headers || {};

  options.headers["Authorization"] =
    "Bearer " + adminToken;

  options.headers["Content-Type"] =
    "application/json";

  var response =
    await fetch(url, options);

  if (response.status === 401) {

    logout();

    throw new Error(
      "Unauthorized"
    );
  }

  return response;
}

async function loadAdmin() {

  try {

    var oddsResponse =
      await adminFetch("/api/odds");

    var oddsData =
      await oddsResponse.json();

    var adminOdds =
      document.getElementById(
        "adminOdds"
      );

    adminOdds.innerHTML =
      oddsData.map(function(item) {

        return (
          '<div class="admin-item">' +
          '<strong>' +
          escapeHTML(item.match) +
          '</strong><br>' +
          escapeHTML(item.pick) +
          ' • ' +
          Number(item.odd).toFixed(2) +
          ' • ' +
          escapeHTML(item.type) +
          '<div class="admin-actions">' +
          '<button class="small-button delete" ' +
          'onclick="deleteOdd(' +
          item.id +
          ')">' +
          'FUTA' +
          '</button>' +
          '</div>' +
          '</div>'
        );

      }).join("");

    var paymentResponse =
      await adminFetch(
        "/api/admin/payments"
      );

    var paymentsData =
      await paymentResponse.json();

    var paymentBox =
      document.getElementById(
        "adminPayments"
      );

    if (!paymentsData.length) {

      paymentBox.innerHTML =
        "<p>Hakuna malipo bado.</p>";

      return;
    }

    paymentBox.innerHTML =
      paymentsData.map(function(payment) {

        var actions = "";

        if (payment.status === "PENDING") {

          actions =
            '<div class="admin-actions">' +

            '<button ' +
            'class="small-button approve" ' +
            'onclick="approvePayment(' +
            payment.id +
            ')">' +
            'IDHINISHA' +
            '</button>' +

            '<button ' +
            'class="small-button reject" ' +
            'onclick="rejectPayment(' +
            payment.id +
            ')">' +
            'KATAA' +
            '</button>' +

            '</div>';
        }

        return (
          '<div class="admin-item">' +

          '<strong>Reference:</strong> ' +
          escapeHTML(payment.reference) +

          '<br>' +

          '<strong>Kiasi:</strong> TSh ' +
          Number(payment.amount)
            .toLocaleString() +

          '<br>' +

          '<strong>Status:</strong> ' +
          escapeHTML(payment.status) +

          actions +

          '</div>'
        );

      }).join("");

  } catch (error) {

    console.log(error);
  }
}

async function addOdd() {

  var match =
    document.getElementById(
      "match"
    ).value.trim();

  var pick =
    document.getElementById(
      "pick"
    ).value.trim();

  var odd =
    document.getElementById(
      "odd"
    ).value;

  var type =
    document.getElementById(
      "oddType"
    ).value;

  var message =
    document.getElementById(
      "addMessage"
    );

  try {

    var response =
      await adminFetch(
        "/api/admin/odds",
        {
          method: "POST",
          body: JSON.stringify({
            match: match,
            pick: pick,
            odd: odd,
            type: type
          })
        }
      );

    var data =
      await response.json();

    if (!response.ok) {

      message.innerHTML =
        '<p class="error">' +
        escapeHTML(data.message) +
        '</p>';

      return;
    }

    document.getElementById(
      "match"
    ).value = "";

    document.getElementById(
      "pick"
    ).value = "";

    document.getElementById(
      "odd"
    ).value = "";

    message.innerHTML =
      '<p class="success">' +
      'Odd imeongezwa vizuri.' +
      '</p>';

    loadAdmin();

  } catch (error) {

    message.innerHTML =
      '<p class="error">' +
      'Imeshindikana kuongeza odd.' +
      '</p>';
  }
}

async function deleteOdd(id) {

  if (
    !confirm(
      "Unataka kufuta odd hii?"
    )
  ) {
    return;
  }

  try {

    await adminFetch(
      "/api/admin/odds/" + id,
      {
        method: "DELETE"
      }
    );

    loadAdmin();

  } catch (error) {}
}

async function approvePayment(id) {

  try {

    await adminFetch(
      "/api/admin/payments/" +
      id +
      "/approve",
      {
        method: "POST"
      }
    );

    loadAdmin();

  } catch (error) {}
}

async function rejectPayment(id) {

  try {

    await adminFetch(
      "/api/admin/payments/" +
      id +
      "/reject",
      {
        method: "POST"
      }
    );

    loadAdmin();

  } catch (error) {}
}

async function logout() {

  try {

    if (adminToken) {

      await adminFetch(
        "/api/admin/logout",
        {
          method: "POST"
        }
      );
    }

  } catch (error) {}

  adminToken = "";

  localStorage.removeItem(
    "yusuphuAdminToken"
  );

  document.getElementById(
    "loginBox"
  ).style.display = "block";

  document.getElementById(
    "adminPanel"
  ).style.display = "none";
}

async function loadSlip() {

  try {

    var response =
      await fetch("/api/odds");

    var data =
      await response.json();

    var selected =
      data.slice(0, 3);

    var total = 1;

    var slip =
      document.getElementById(
        "slip"
      );

    slip.innerHTML =
      selected.map(function(item) {

        total =
          total * Number(item.odd);

        return (
          '<div class="odd-card">' +
          '<div>' +
          escapeHTML(item.match) +
          '<br>' +
          escapeHTML(item.pick) +
          '</div>' +
          '<div class="odd-number">' +
          Number(item.odd).toFixed(2) +
          '</div>' +
          '</div>'
        );

      }).join("");

    document.getElementById(
      "totalOdds"
    ).textContent =
      total.toFixed(2);

  } catch (error) {}
}

if (adminToken) {

  document.getElementById(
    "loginBox"
  ).style.display = "none";

  document.getElementById(
    "adminPanel"
  ).style.display = "block";
}

loadFreeOdds();

</script>

</body>
</html>
`;

// ===============================
// HOME
// ===============================

app.get("/", function (req, res) {
  res.type("html").send(html);
});

// ===============================
// SERVER
// ===============================

app.listen(
  PORT,
  "0.0.0.0",
  function () {
    console.log(
      "YUSUPHU ODDS VIP running on port " +
      PORT
    );
  }
);
