const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// SETTINGS
// =====================================================

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "BADILISHA_PASSWORD_HAPA";

const VIP_PRICE = 5000;

const PAYMENT_NUMBERS = {
  "M-Pesa": "0793401886",
  "Airtel Money": "WEKA_NAMBA_AIRTEL",
  "HaloPesa": "WEKA_NAMBA_HALOPESA"
};

// =====================================================
// DATA
// =====================================================

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

// =====================================================
// HEALTH
// =====================================================

app.get("/api/health", function (req, res) {
  res.json({
    success: true,
    app: "YUSUPHU ODDS VIP"
  });
});

// =====================================================
// CONFIG
// =====================================================

app.get("/api/config", function (req, res) {
  res.json({
    success: true,
    price: VIP_PRICE,
    paymentNumbers: PAYMENT_NUMBERS
  });
});

// =====================================================
// ODDS
// =====================================================

app.get("/api/odds", function (req, res) {
  res.json(odds);
});

// =====================================================
// PAYMENT
// =====================================================

app.post("/api/payment", function (req, res) {
  const reference = String(
    req.body.reference || ""
  ).trim();

  const method = String(
    req.body.method || "M-Pesa"
  ).trim();

  if (!reference) {
    return res.status(400).json({
      success: false,
      message: "Weka Payment Reference."
    });
  }

  if (!PAYMENT_NUMBERS[method]) {
    return res.status(400).json({
      success: false,
      message: "Chagua njia sahihi ya malipo."
    });
  }

  if (
    PAYMENT_NUMBERS[method].startsWith("WEKA_")
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Namba ya " +
        method +
        " bado haijawekwa."
    });
  }

  const exists = payments.some(
    function (payment) {
      return (
        payment.reference.toLowerCase() ===
        reference.toLowerCase()
      );
    }
  );

  if (exists) {
    return res.status(409).json({
      success: false,
      message:
        "Reference hii tayari imetumwa."
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

// =====================================================
// PAYMENT STATUS
// =====================================================

app.get(
  "/api/payment-status/:reference",
  function (req, res) {
    const reference =
      String(req.params.reference || "").trim();

    const payment = payments.find(
      function (item) {
        return (
          item.reference.toLowerCase() ===
          reference.toLowerCase()
        );
      }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Payment Reference haijapatikana."
      });
    }

    let message =
      "Malipo bado yanasubiri uthibitisho wa Admin.";

    if (payment.status === "APPROVED") {
      message =
        "Malipo yamethibitishwa. VIP imefunguliwa.";
    }

    if (payment.status === "REJECTED") {
      message =
        "Malipo yamekataliwa.";
    }

    res.json({
      success: true,
      status: payment.status,
      message: message
    });
  }
);

// =====================================================
// ADMIN LOGIN
// =====================================================

app.post(
  "/api/admin/login",
  function (req, res) {
    const password =
      String(req.body.password || "");

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
  }
);

// =====================================================
// ADMIN LOGOUT
// =====================================================

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

// =====================================================
// ADMIN PAYMENTS
// =====================================================

app.get(
  "/api/admin/payments",
  requireAdmin,
  function (req, res) {
    res.json(payments);
  }
);

// =====================================================
// APPROVE PAYMENT
// =====================================================

app.post(
  "/api/admin/payments/:id/approve",
  requireAdmin,
  function (req, res) {
    const id = Number(req.params.id);

    const payment = payments.find(
      function (item) {
        return item.id === id;
      }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Malipo hayajapatikana."
      });
    }

    payment.status = "APPROVED";

    res.json({
      success: true,
      payment: payment
    });
  }
);

// =====================================================
// REJECT PAYMENT
// =====================================================

app.post(
  "/api/admin/payments/:id/reject",
  requireAdmin,
  function (req, res) {
    const id = Number(req.params.id);

    const payment = payments.find(
      function (item) {
        return item.id === id;
      }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          "Malipo hayajapatikana."
      });
    }

    payment.status = "REJECTED";

    res.json({
      success: true,
      payment: payment
    });
  }
);

// =====================================================
// ADD ODDS
// =====================================================

app.post(
  "/api/admin/odds",
  requireAdmin,
  function (req, res) {
    const match =
      String(req.body.match || "").trim();

    const pick =
      String(req.body.pick || "").trim();

    const odd =
      Number(req.body.odd);

    const type =
      String(
        req.body.type || "VIP"
      ).toUpperCase();

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
      type:
        type === "FREE"
          ? "FREE"
          : "VIP"
    };

    odds.unshift(newOdd);

    res.status(201).json({
      success: true,
      item: newOdd
    });
  }
);

// =====================================================
// DELETE ODDS
// =====================================================

app.delete(
  "/api/admin/odds/:id",
  requireAdmin,
  function (req, res) {
    const id =
      Number(req.params.id);

    const oldLength =
      odds.length;

    odds = odds.filter(
      function (item) {
        return item.id !== id;
      }
    );

    if (odds.length === oldLength) {
      return res.status(404).json({
        success: false,
        message:
          "Odd haijapatikana."
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
  background:
    linear-gradient(
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

  grid-template-columns:
    repeat(3, 1fr);

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
  background:
    linear-gradient(
      145deg,
      #123554,
      #082443
    );

  border: 1px solid #15558c;

  border-radius: 22px;

  padding: 30px;

  margin-bottom: 18px;

  box-shadow:
    0 8px 25px #0005;
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
  font-size: 42px;

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

  justify-content:
    space-between;

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

  cursor: pointer;
}

.approve {
  background: #19df83;
}

.reject,
.delete {
  background: #ef4f61;

  color: white;
}

.payment-method {
  border: 1px solid #15558c;

  border-radius: 14px;

  padding: 15px;

  margin: 12px 0;
}

.method-number {
  font-size: 25px;

  font-weight: 900;

  color: #19e68b;
}

footer {
  background: #030b15;

  text-align: center;

  padding: 30px;

  color: #a8bbcf;
}

hr {
  border: 0;

  border-top:
    1px solid #31516e;

  margin: 25px 0;
}

@media(max-width:650px) {

  .hero-title {
    font-size: 30px;
  }

  .hero p {
    font-size: 15px;
  }

  .navigation {
    grid-template-columns:
      repeat(2, 1fr);
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
    font-size: 31px;
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
Free Odds • VIP TSh 5,000 •
Bet Slip Calculator
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

<section
id="home"
class="page active">

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

<h2>
💳 JINSI YA KULIPA
</h2>

<p>
Lipa TSh 5,000 kwa
M-Pesa:
</p>

<div class="payment-method">

<strong>M-Pesa</strong>

<div class="method-number">
📱 0793401886
</div>

</div>

<p>
Baada ya kufanya malipo,
utapokea
<strong>
Reference/Transaction ID
</strong>
kupitia SMS.
</p>

<button
class="green-button"
onclick="showPage('payment')">

✅ NIMEFANYA MALIPO

</button>

</div>

<div class="card">

<h2>
🆓 FREE ODDS
</h2>

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

<section
id="free"
class="page">

<h2>
🆓 FREE ODDS
</h2>

<div id="freeOdds"></div>

</section>

<section
id="vip"
class="page">

<h2>
⭐ VIP ODDS
</h2>

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

<section
id="mkeka"
class="page">

<h2>
🎟️ MKEKA
</h2>

<div class="card">

<p>
Bet Slip Calculator
</p>

<div id="slip"></div>

<h2>
Total Odds:
<span id="totalOdds">
1.00
</span>
</h2>

</div>

</section>

<section
id="payment"
class="page">

<h2>
💳 LIPA TSh 5,000
</h2>

<div class="card">

<h2>
💳 JINSI YA KULIPA
</h2>

<div class="amount">
TSh 5,000
</div>

<p>
Chagua njia ya malipo:
</p>

<select
id="paymentMethod"
onchange="updatePaymentNumber()">

<option value="M-Pesa">
M-Pesa
</option>

<option value="Airtel Money">
Airtel Money
</option>

<option value="HaloPesa">
HaloPesa
</option>

</select>

<div
id="selectedPaymentNumber"
class="phone-number">

📱 0793401886

</div>

<p id="paymentInstruction">
Tuma TSh 5,000 kwenda namba hiyo.
</p>

<hr>

<h3>
🧾 Payment Reference
</h3>

<p>
Baada ya kufanya malipo,
fungua SMS ya muamala
na uweke
Reference/Transaction ID hapa.
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

<section
id="admin"
class="page">

<h2>
🔐 ADMIN
</h2>

<div
class="card"
id="loginBox">

<h2>
Admin Login
</h2>

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

<div
id="adminPanel"
style="display:none">

<div class="card">

<h2>
➕ ONGEZA ODDS
</h2>

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

<option value="VIP">
VIP
</option>

<option value="FREE">
FREE
</option>

</select>

<button
class="green-button"
onclick="addOdd()">

➕ ONGEZA ODD

</button>

<div id="addMessage"></div>

</div>

<div class="card">

<h2>
⚽ ODDS ZILIZOPO
</h2>

<div id="adminOdds"></div>

</div>

<div class="card">

<h2>
💰 MALIPO
</h2>

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

<strong>
YUSUPHU ODDS VIP
</strong>

<p>
© 2026 • Football Predictions
</p>

<p>
🔞 18+ Bet Responsibly
</p>

</footer>

<script>

var adminToken =
localStorage.getItem(
"yusuphuAdminToken"
) || "";

var paymentNumbers = {

"M-Pesa":
"0793401886",

"Airtel Money":
"WEKA_NAMBA_AIRTEL",

"HaloPesa":
"WEKA_NAMBA_HALOPESA"

};

function showPage(id) {

var pages =
document.querySelectorAll(
".page"
);

pages.forEach(
function(page) {

page.classList.remove(
"active"
);

});

var selected =
document.getElementById(id);

if (selected) {

selected.classList.add(
"active"
);

}

window.scrollTo(0,0);

if (id === "free") {

loadFreeOdds();

}

if (id === "mkeka") {

loadSlip();

}

if (
id === "admin" &&
adminToken
) {

loadAdmin();

}

if (id === "payment") {

updatePaymentNumber();

}

}

function escapeHTML(value) {

return String(value).replace(
/[&<>"']/g,
function(char) {

var map = {

"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"

};

return map[char];

});

}

function updatePaymentNumber() {

var method =
document.getElementById(
"paymentMethod"
).value;

var number =
paymentNumbers[method];

var numberBox =
document.getElementById(
"selectedPaymentNumber"
);

var instruction =
document.getElementById(
"paymentInstruction"
);

if (
number &&
number.indexOf("WEKA_") !== 0
) {

numberBox.textContent =
"📱 " + number;

instruction.textContent =
"Tuma TSh 5,000 kwenda namba hiyo.";

} else {

numberBox.textContent =
"📱 Namba bado haijawekwa";

instruction.textContent =
"Njia hii bado haijawa tayari. Tumia M-Pesa kwa sasa.";

}

}

async function loadFreeOdds() {

var box =
document.getElementById(
"freeOdds"
);

try {

var response =
await fetch("/api/odds");

var data =
await response.json();

var free =
data.filter(
function(item) {

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
free.map(
function(item) {

return (

'<div class="odd-card">' +

'<div>' +

'<strong>' +

escapeHTML(
item.match
) +

'</strong><br>' +

escapeHTML(
item.pick
) +

'</div>' +

'<div class="odd-number">' +

Number(
item.odd
).toFixed(2) +

'</div>' +

'</div>'

);

}
).join("");

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

var method =
document.getElementById(
"paymentMethod"
).value;

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

if (
!paymentNumbers[method] ||
paymentNumbers[method]
.indexOf("WEKA_") === 0
) {

message.innerHTML =
'<p class="error">' +
'Tafadhali tumia M-Pesa kwa sasa.' +
'</p>';

return;

}

try {

var response =
await fetch(
"/api/payment",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify({

reference:reference,

method:method

})

}
);

var data =
await response.json();

if (!response.ok) {

message.innerHTML =
'<p class="error">' +
escapeHTML(
data.message
) +
'</p>';

return;

}

message.innerHTML =
'<p class="success">' +
escapeHTML(
data.message
) +
'<br>Reference: ' +
escapeHTML(
reference
) +
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
encodeURIComponent(
reference
)
);

var data =
await response.json();

if (!response.ok) {

message.innerHTML =
'<p class="error">' +
escapeHTML(
data.message
) +
'</p>';

box.innerHTML = "";

return;

}

if (
data.status !== "APPROVED"
) {

message.innerHTML =
'<p class="error">' +
escapeHTML(
data.message
) +
'</p>';

box.innerHTML = "";

return;

}

message.innerHTML =
'<p class="success">' +
'Malipo yamethibitishwa. VIP imefunguliwa.' +
'</p>';

var oddsResponse =
await fetch(
"/api/odds"
);

var oddsData =
await oddsResponse.json();

var vip =
oddsData.filter(
function(item) {

return item.type === "VIP";

});

if (!vip.length) {

box.innerHTML =
'<div class="card">' +
'<p>Hakuna VIP Odds zilizowekwa bado.</p>' +
'</div>';

return;

}

box.innerHTML =
vip.map(
function(item) {

return (

'<div class="odd-card">' +

'<div>' +

'<strong>' +

escapeHTML(
item.match
) +

'</strong><br>' +

escapeHTML(
item.pick
) +

'</div>' +

'<div class="odd-number">' +

Number(
item.odd
).toFixed(2) +

'</div>' +

'</div>'

);

}
).join("");

} catch (error) {

message.innerHTML =
'<p class="error">' +
'Tatizo la server.' +
'</p>';

}

}async function adminLogin() {

  var password =
    document.getElementById("adminPassword").value.trim();

  if (!password) {
    alert("Weka password ya Admin.");
    return;
  }

  var res = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      password: password
    })
  });

  var data = await res.json();

  if (!data.success) {
    alert(data.message || "Password si sahihi.");
    return;
  }

  localStorage.setItem("adminToken", data.token);

  document.getElementById("adminLoginBox").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";

  loadAdmin();
}


async function adminFetch(url, options) {

  options = options || {};

  options.headers = options.headers || {};

  options.headers["Authorization"] =
    "Bearer " + localStorage.getItem("adminToken");

  var res = await fetch(url, options);

  if (res.status === 401) {

    localStorage.removeItem("adminToken");

    document.getElementById("adminLoginBox").style.display =
      "block";

    document.getElementById("adminPanel").style.display =
      "none";

    alert("Session ya Admin imeisha. Ingia tena.");

    return null;
  }

  return res;
}


async function loadAdmin() {

  var token = localStorage.getItem("adminToken");

  if (!token) {
    document.getElementById("adminLoginBox").style.display =
      "block";

    document.getElementById("adminPanel").style.display =
      "none";

    return;
  }

  document.getElementById("adminLoginBox").style.display =
    "none";

  document.getElementById("adminPanel").style.display =
    "block";


  var paymentRes =
    await adminFetch("/api/admin/payments");

  if (!paymentRes) return;

  var paymentData =
    await paymentRes.json();

  var paymentList =
    document.getElementById("adminPayments");

  paymentList.innerHTML = "";


  if (!paymentData.payments ||
      paymentData.payments.length === 0) {

    paymentList.innerHTML =
      "<p>Hakuna malipo kwa sasa.</p>";

  } else {

    paymentData.payments.forEach(function (payment) {

      var div =
        document.createElement("div");

      div.className = "admin-card";

      div.innerHTML =
        "<b>Reference:</b> " +
        payment.reference +
        "<br>" +

        "<b>Njia:</b> " +
        payment.method +
        "<br>" +

        "<b>Kiasi:</b> TSh " +
        payment.amount +
        "<br>" +

        "<b>Status:</b> " +
        payment.status +
        "<br><br>" +

        "<button onclick=\"approvePayment(" +
        payment.id +
        ")\">APPROVE</button> " +

        "<button class=\"danger\" onclick=\"rejectPayment(" +
        payment.id +
        ")\">REJECT</button>";

      paymentList.appendChild(div);

    });

  }


  var oddsRes =
    await adminFetch("/api/odds");

  if (!oddsRes) return;

  var oddsData =
    await oddsRes.json();

  var oddsList =
    document.getElementById("adminOdds");

  oddsList.innerHTML = "";


  oddsData.odds.forEach(function (odd) {

    var div =
      document.createElement("div");

    div.className = "admin-card";

    div.innerHTML =
      "<b>" +
      odd.match +
      "</b><br>" +

      odd.market +
      " - " +
      odd.odd +
      "<br>" +

      "<b>" +
      odd.type +
      "</b><br><br>" +

      "<button class=\"danger\" onclick=\"deleteOdd(" +
      odd.id +
      ")\">DELETE</button>";

    oddsList.appendChild(div);

  });

}


async function addOdd() {

  var match =
    document.getElementById("oddMatch").value.trim();

  var market =
    document.getElementById("oddMarket").value.trim();

  var odd =
    document.getElementById("oddValue").value.trim();

  var type =
    document.getElementById("oddType").value;


  if (!match || !market || !odd) {

    alert("Jaza taarifa zote za odd.");

    return;
  }


  var res =
    await adminFetch("/api/admin/odds", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        match: match,

        market: market,

        odd: Number(odd),

        type: type

      })

    });


  if (!res) return;

  var data =
    await res.json();


  if (!data.success) {

    alert(
      data.message ||
      "Imeshindikana kuongeza odd."
    );

    return;
  }


  alert("Odd imeongezwa.");

  document.getElementById("oddMatch").value = "";

  document.getElementById("oddMarket").value = "";

  document.getElementById("oddValue").value = "";

  loadAdmin();

}


async function deleteOdd(id) {

  if (!confirm("Una uhakika unataka kufuta odd hii?")) {
    return;
  }


  var res =
    await adminFetch(
      "/api/admin/odds/" + id,
      {
        method: "DELETE"
      }
    );


  if (!res) return;


  var data =
    await res.json();


  if (!data.success) {

    alert(
      data.message ||
      "Imeshindikana kufuta odd."
    );

    return;
  }


  alert("Odd imefutwa.");

  loadAdmin();

}


async function approvePayment(id) {

  if (!confirm("Thibitisha ku-APPROVE malipo haya?")) {
    return;
  }


  var res =
    await adminFetch(
      "/api/admin/payments/" +
      id +
      "/approve",
      {
        method: "POST"
      }
    );


  if (!res) return;


  var data =
    await res.json();


  if (!data.success) {

    alert(
      data.message ||
      "Imeshindikana ku-approve."
    );

    return;
  }


  alert(
    "Malipo yamekubaliwa. VIP imefunguliwa."
  );


  loadAdmin();

}


async function rejectPayment(id) {

  if (!confirm("Thibitisha ku-REJECT malipo haya?")) {
    return;
  }


  var res =
    await adminFetch(
      "/api/admin/payments/" +
      id +
      "/reject",
      {
        method: "POST"
      }
    );


  if (!res) return;


  var data =
    await res.json();


  if (!data.success) {

    alert(
      data.message ||
      "Imeshindikana ku-reject."
    );

    return;
  }


  alert("Malipo yamekataliwa.");

  loadAdmin();

}


async function logout() {

  var token =
    localStorage.getItem("adminToken");


  if (token) {

    await fetch(
      "/api/admin/logout",
      {
        method: "POST",

        headers: {
          "Authorization":
            "Bearer " + token
        }
      }
    );

  }


  localStorage.removeItem("adminToken");


  document.getElementById("adminLoginBox").style.display =
    "block";

  document.getElementById("adminPanel").style.display =
    "none";

  document.getElementById("adminPassword").value = "";

}


function loadSlip() {

  var slip =
    JSON.parse(
      localStorage.getItem("betSlip") || "[]"
    );


  var slipBox =
    document.getElementById("betSlip");


  if (!slipBox) return;


  slipBox.innerHTML = "";


  if (slip.length === 0) {

    slipBox.innerHTML =
      "<p>Bet Slip yako iko tupu.</p>";

    return;
  }


  var total = 1;


  slip.forEach(function (item, index) {

    var value =
      Number(item.odd);


    total =
      total * value;


    var div =
      document.createElement("div");

    div.className = "slip-item";


    div.innerHTML =
      "<b>" +
      item.match +
      "</b><br>" +

      item.market +
      " @ " +
      value.toFixed(2) +

      "<button onclick=\"removeSlip(" +
      index +
      ")\">X</button>";


    slipBox.appendChild(div);

  });


  var totalBox =
    document.createElement("div");


  totalBox.className =
    "total-odds";


  totalBox.innerHTML =
    "<b>Total Odds: " +
    total.toFixed(2) +
    "</b>";


  slipBox.appendChild(totalBox);

}


function removeSlip(index) {

  var slip =
    JSON.parse(
      localStorage.getItem("betSlip") || "[]"
    );


  slip.splice(index, 1);


  localStorage.setItem(
    "betSlip",
    JSON.stringify(slip)
  );


  loadSlip();

}


function updatePaymentNumber() {

  var method =
    document.getElementById("paymentMethod");


  var number =
    document.getElementById("paymentNumber");


  if (!method || !number) return;


  var selected =
    method.value;


  var numbers = {

    "M-Pesa": "0793401886",

    "Airtel Money": "WEKA NAMBA AIRTEL",

    "HaloPesa": "WEKA NAMBA HALOPESA"

  };


  number.innerText =
    numbers[selected] ||
    "0793401886";

}


document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadFreeOdds();

    loadSlip();

    updatePaymentNumber();


    var method =
      document.getElementById(
        "paymentMethod"
      );


    if (method) {

      method.addEventListener(
        "change",
        updatePaymentNumber
      );

    }


    var token =
      localStorage.getItem(
        "adminToken"
      );


    if (token) {

      loadAdmin();

    }

  }
);

</script>

</body>

</html>
`;



app.get("/", function (req, res) {

  res.type("html").send(html);

});



app.listen(
  PORT,
  "0.0.0.0",
  function () {

    console.log(
      "YUSUPHU ODDS VIP server running on port " +
      PORT
    );

  }
);app.listen(
  PORT,
  "0.0.0.0",
  function () {
    console.log(
      "YUSUPHU ODDS VIP server running on port " +
      PORT
    );
  }
);
