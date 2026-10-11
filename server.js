const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

// ===============================
// SETTINGS
// ===============================
const PAYMENT_NUMBER = "0793401886";
const PAYMENT_AMOUNT = 5000;

// Weka password yako ya Admin hapa
const ADMIN_PASSWORD = "WEKA_PASSWORD_YAKO_HAPA";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// DATA
// ===============================
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

let payments = [];
let adminTokens = new Set();

// ===============================
// HOME PAGE
// ===============================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="sw">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YUSUPHU ODDS VIP</title>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #07111f;
  color: white;
}

header {
  background: #0d6efd;
  padding: 20px;
  text-align: center;
}

header h1 {
  margin: 0;
}

nav {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background: #101c2d;
  flex-wrap: wrap;
}

button {
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.navbtn {
  background: #198754;
  color: white;
}

.container {
  max-width: 700px;
  margin: auto;
  padding: 20px;
}

.box {
  background: #111f33;
  padding: 20px;
  margin: 15px 0;
  border-radius: 12px;
}

input {
  width: 100%;
  padding: 13px;
  margin: 8px 0;
  box-sizing: border-box;
  border-radius: 7px;
  border: none;
}

.btn {
  background: #ffc107;
  color: black;
}

.vip {
  background: #198754;
  color: white;
  padding: 15px;
  margin: 10px 0;
  border-radius: 10px;
}

.odd {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.odd-value {
  font-size: 24px;
  font-weight: bold;
  color: #ffc107;
}

.hidden {
  display: none;
}

.danger {
  background: #dc3545;
  color: white;
}

.success {
  color: #00ff88;
}

.error {
  color: #ff5555;
}

footer {
  text-align: center;
  padding: 25px;
  color: #aaa;
}
</style>
</head>

<body>

<header>
  <h1>⚽ YUSUPHU ODDS VIP</h1>
  <p>VIP Football Predictions</p>
</header>

<nav>
  <button class="navbtn" onclick="showPage('home')">🏠 HOME</button>
  <button class="navbtn" onclick="showPage('payment')">💳 LIPA TSh 5,000</button>
  <button class="navbtn" onclick="showPage('vip')">⭐ VIP ODDS</button>
  <button class="navbtn" onclick="showPage('admin')">🔐 ADMIN</button>
</nav>

<div class="container">

<!-- HOME -->
<section id="home">

<div class="box">
<h2>Karibu YUSUPHU ODDS VIP</h2>

<p>
Pata odds na prediction maalum za VIP.
</p>

<button class="btn" onclick="showPage('payment')">
LIPA TSh 5,000
</button>
</div>

<div class="box">
<h3>📢 Jinsi ya kupata VIP Odds</h3>

<p>1. Lipa TSh 5,000</p>
<p>2. Tumia namba: <strong>0793401886</strong></p>
<p>3. Tuma kumbukumbu ya malipo</p>
<p>4. Subiri uthibitisho wa Admin</p>
<p>5. Fungua VIP Odds</p>
</div>

</section>


<!-- PAYMENT -->
<section id="payment" class="hidden">

<div class="box">

<h2>💳 MALIPO YA VIP</h2>

<p>Weka malipo ya:</p>

<h1>TSh 5,000</h1>

<p>Namba ya malipo:</p>

<h2>📱 0793401886</h2>

<p>
Baada ya kufanya malipo, weka namba ya kumbukumbu hapa chini.
</p>

<form onsubmit="submitPayment(event)">

<input
id="paymentRef"
placeholder="Payment Reference"
required
>

<button class="btn">
NIMEFANYA MALIPO
</button>

</form>

<div id="paymentMessage"></div>

</div>

</section>


<!-- VIP -->
<section id="vip" class="hidden">

<div class="box">

<h2>⭐ VIP ODDS</h2>

<p>Odds zinazopatikana sasa:</p>

<div id="oddsList"></div>

</div>

</section>


<!-- ADMIN -->
<section id="admin" class="hidden">

<div class="box" id="loginBox">

<h2>🔐 ADMIN LOGIN</h2>

<form onsubmit="adminLogin(event)">

<input
id="adminPassword"
type="password"
placeholder="Ingiza Admin Password"
required
>

<button class="btn">
INGIA ADMIN
</button>

</form>

<div id="adminMessage"></div>

</div>


<div class="box hidden" id="adminPanel">

<h2>⚙️ ADMIN PANEL</h2>

<h3>➕ Ongeza VIP Odd</h3>

<form onsubmit="addOdd(event)">

<input
id="match"
placeholder="Mfano: Arsenal vs Chelsea"
required
>

<input
id="pick"
placeholder="Mfano: Over 2.5"
required
>

<input
id="odd"
type="number"
step="0.01"
placeholder="Odd mfano 1.85"
required
>

<button class="btn">
ONGEZA ODDS
</button>

</form>

<hr>

<h3>📋 VIP Odds</h3>

<div id="adminOdds"></div>

<hr>

<h3>💰 MALIPO</h3>

<div id="payments"></div>

</div>

</section>

</div>

<footer>
YUSUPHU ODDS VIP © 2026
</footer>


<script>

let adminToken = sessionStorage.getItem("adminToken");


function showPage(page) {

  document.querySelectorAll(".container section")
    .forEach(section => {
      section.classList.add("hidden");
    });

  document.getElementById(page)
    .classList.remove("hidden");

  if (page === "vip") {
    loadOdds();
  }

  if (page === "admin" && adminToken) {
    document.getElementById("loginBox")
      .classList.add("hidden");

    document.getElementById("adminPanel")
      .classList.remove("hidden");

    loadAdmin();
  }
}


// ===============================
// LOAD ODDS
// ===============================
async function loadOdds() {

  const response = await fetch("/api/odds");
  const data = await response.json();

  const list = document.getElementById("oddsList");

  list.innerHTML = data.map(o => {

    return \`
      <div class="vip">
        <div class="odd">
          <div>
            <strong>\${escapeHtml(o.match)}</strong>
            <br>
            <span>\${escapeHtml(o.pick)}</span>
          </div>

          <div class="odd-value">
            \${Number(o.odd).toFixed(2)}
          </div>
        </div>
      </div>
    \`;

  }).join("");
}


// ===============================
// PAYMENT
// ===============================
async function submitPayment(event) {

  event.preventDefault();

  const reference =
    document.getElementById("paymentRef").value;

  const response = await fetch("/api/payment", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      reference: reference
    })

  });

  const data = await response.json();

  if (data.success) {

    document.getElementById("paymentMessage")
      .innerHTML =
      '<p class="success">✅ Malipo yamepokelewa. Subiri Admin athibitishe.</p>';

    document.getElementById("paymentRef").value = "";

  } else {

    document.getElementById("paymentMessage")
      .innerHTML =
      '<p class="error">❌ ' + data.message + '</p>';

  }
}


// ===============================
// ADMIN LOGIN
// ===============================
async function adminLogin(event) {

  event.preventDefault();

  const password =
    document.getElementById("adminPassword").value;

  const response = await fetch("/api/admin/login", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      password: password
    })

  });

  const data = await response.json();

  if (!data.success) {

    document.getElementById("adminMessage")
      .innerHTML =
      '<p class="error">❌ Password sio sahihi.</p>';

    return;
  }

  adminToken = data.token;

  sessionStorage.setItem(
    "adminToken",
    adminToken
  );

  document.getElementById("loginBox")
    .classList.add("hidden");

  document.getElementById("adminPanel")
    .classList.remove("hidden");

  loadAdmin();
}


// ===============================
// ADD ODD
// ===============================
async function addOdd(event) {

  event.preventDefault();

  const match =
    document.getElementById("match").value;

  const pick =
    document.getElementById("pick").value;

  const odd =
    document.getElementById("odd").value;

  const response = await fetch("/api/odds", {

    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + adminToken
    },

    body: JSON.stringify({
      match,
      pick,
      odd
    })

  });

  const data = await response.json();

  if (!response.ok) {

    alert(data.error || "Imeshindikana");

    return;
  }

  document.getElementById("match").value = "";
  document.getElementById("pick").value = "";
  document.getElementById("odd").value = "";

  loadAdmin();

  alert("✅ Odd imeongezwa.");
}


// ===============================
// ADMIN DATA
// ===============================
async function loadAdmin() {

  const response = await fetch("/api/odds");

  const data = await response.json();

  document.getElementById("adminOdds").innerHTML =
    data.map(o => \`

      <div class="box">

        <strong>\${escapeHtml(o.match)}</strong>

        <br>

        \${escapeHtml(o.pick)}
        —
        <strong>\${Number(o.odd).toFixed(2)}</strong>

        <br><br>

        <button
          class="danger"
          onclick="deleteOdd(\${o.id})">
          FUTA
        </button>

      </div>

    \`).join("");

  const paymentResponse =
    await fetch("/api/payments");

  const paymentData =
    await paymentResponse.json();

  document.getElementById("payments").innerHTML =
    paymentData.map(p => \`

      <div class="box">

        <strong>Reference:</strong>
        \${escapeHtml(p.reference)}

        <br>

        <strong>Status:</strong>
        \${escapeHtml(p.status)}

      </div>

    \`).join("");
}


// ===============================
// DELETE ODD
// ===============================
async function deleteOdd(id) {

  if (!confirm("Unataka kufuta odd hii?")) {
    return;
  }

  const response = await fetch(
    "/api/odds/" + id,
    {
      method: "DELETE",
      headers: {
        "Authorization":
          "Bearer " + adminToken
      }
    }
  );

  if (response.ok) {
    loadAdmin();
  }
}


// ===============================
// ESCAPE HTML
// ===============================
function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    function(c) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c];

    }
  );

}

</script>

</body>
</html>
  `);
});


// ===============================
// HEALTH CHECK
// ===============================
app.get("/api/health", (req, res) => {

  res.json({
    ok: true,
    app: "YUSUPHU ODDS VIP"
  });

});


// ===============================
// GET ODDS
// ===============================
app.get("/api/odds", (req, res) => {

  res.json(odds);

});


// ===============================
// ADMIN AUTH
// ===============================
function requireAdmin(req, res, next) {

  const header =
    req.headers.authorization || "";

  const token =
    header.startsWith("Bearer ")
      ? header.substring(7)
      : "";

  if (!adminTokens.has(token)) {

    return res.status(401).json({
      error: "Admin login required."
    });

  }

  next();

}


// ===============================
// ADMIN LOGIN
// ===============================
app.post("/api/admin/login", (req, res) => {

  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {

    return res.status(401).json({
      success: false,
      message: "Password sio sahihi."
    });

  }

  const token =
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .substring(2);

  adminTokens.add(token);

  res.json({
    success: true,
    token: token
  });

});


// ===============================
// ADD ODDS
// ===============================
app.post(
  "/api/odds",
  requireAdmin,
  (req, res) => {

    const { match, pick, odd } = req.body;

    if (!match || !pick || !odd) {

      return res.status(400).json({
        error: "Jaza match, pick na odd."
      });

    }

    const item = {

      id: Date.now(),

      match: match,

      pick: pick,

      odd: Number(odd),

      status: "VIP"

    };

    odds.unshift(item);

    res.status(201).json(item);

  }
);


// ===============================
// DELETE ODDS
// ===============================
app.delete(
  "/api/odds/:id",
  requireAdmin,
  (req, res) => {

    const id =
      Number(req.params.id);

    const before =
      odds.length;

    odds =
      odds.filter(
        item => item.id !== id
      );

    if (odds.length === before) {

      return res.status(404).json({
        error: "Odd haijapatikana."
      });

    }

    res.json({
      success: true
    });

  }
);


// ===============================
// PAYMENT SUBMISSION
// ===============================
app.post("/api/payment", (req, res) => {

  const { reference } = req.body;

  if (!reference) {

    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });

  }

  payments.unshift({

    id: Date.now(),

    reference: reference,

    amount: PAYMENT_AMOUNT,

    phone: PAYMENT_NUMBER,

    status: "PENDING"

  });

  res.json({

    success: true,

    message: "Malipo yamepokelewa."

  });

});


// ===============================
// ADMIN PAYMENTS
// ===============================
app.get(
  "/api/payments",
  requireAdmin,
  (req, res) => {

    res.json(payments);

  }
);


// ===============================
// START SERVER
// ===============================
app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "YUSUPHU ODDS VIP running on port " +
      PORT
    );

  }
);
