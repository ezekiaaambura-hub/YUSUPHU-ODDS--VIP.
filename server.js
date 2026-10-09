const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

// ================================
// YUSUPHU ODDS VIP SETTINGS
// ================================

const APP_NAME = "YUSUPHU ODDS VIP";
const VIP_PRICE = 5000;

const MPESA = "0793401886";
const AIRTEL = "0692359311";
const HALOPESA = "0613431930";

// Weka password yako hapa.
// USITUME PASSWORD YAKO KWANGU.
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "BADILISHA_PASSWORD_HAPA";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================
// FREE ODDS
// ================================

let freeOdds = [
  {
    id: 1,
    match: "Arsenal vs Chelsea",
    pick: "Over 1.5",
    odd: 1.35,
    league: "Premier League"
  },
  {
    id: 2,
    match: "Barcelona vs Sevilla",
    pick: "Barcelona Win",
    odd: 1.45,
    league: "La Liga"
  }
];

// ================================
// VIP ODDS
// ================================

let vipOdds = [
  {
    id: 101,
    match: "Arsenal vs Chelsea",
    pick: "Over 2.5",
    odd: 1.85,
    league: "Premier League"
  },
  {
    id: 102,
    match: "Barcelona vs Sevilla",
    pick: "Barcelona Win",
    odd: 1.60,
    league: "La Liga"
  },
  {
    id: 103,
    match: "Real Madrid vs Valencia",
    pick: "BTTS",
    odd: 1.75,
    league: "La Liga"
  }
];

// ================================
// PAYMENTS
// ================================

let payments = [];

// Admin login tokens
const adminTokens = new Set();

// ================================
// ADMIN SECURITY
// ================================

function requireAdmin(req, res, next) {
  const authorization =
    req.headers.authorization || "";

  const token =
    authorization.startsWith("Bearer ")
      ? authorization.substring(7)
      : "";

  if (!adminTokens.has(token)) {
    return res.status(401).json({
      error: "Admin login required."
    });
  }

  next();
}

// ================================
// HOME PAGE
// ================================

app.get("/", (req, res) => {

res.send(`

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
  background: #06101f;
  color: white;
}

/* HEADER */

.header {
  background: #0877f9;
  padding: 30px 15px;
  text-align: center;
}

.logo {
  font-size: 42px;
  font-weight: 800;
}

.subtitle {
  margin-top: 15px;
  font-size: 22px;
}

/* NAVIGATION */

.nav {
  background: #101d30;
  padding: 18px 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.nav button {
  border: none;
  border-radius: 10px;
  padding: 14px 18px;
  font-size: 17px;
  font-weight: bold;
  cursor: pointer;
  background: white;
  color: #111;
}

.nav button:hover {
  transform: scale(1.03);
}

/* MAIN */

.container {
  max-width: 900px;
  margin: auto;
  padding: 22px;
}

.page {
  display: none;
}

.page.active {
  display: block;
}

/* CARDS */

.card {
  background: #122640;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 18px;
  box-shadow: 0 8px 25px rgba(0,0,0,.25);
}

.hero {
  padding: 42px 30px;
}

.hero-small {
  color: #25d98a;
  font-size: 22px;
  font-weight: bold;
}

.hero h1 {
  font-size: 46px;
  margin: 15px 0;
}

.hero p {
  font-size: 22px;
  line-height: 1.5;
}

/* BUTTONS */

.btn {
  border: none;
  border-radius: 12px;
  padding: 15px 22px;
  font-size: 17px;
  font-weight: bold;
  cursor: pointer;
}

.green {
  background: #25d98a;
  color: #07111d;
}

.blue {
  background: #0877f9;
  color: white;
}

.red {
  background: #e63946;
  color: white;
}

.yellow {
  background: #ffc107;
  color: #111;
}

/* PAYMENT */

.payment-number {
  font-size: 34px;
  font-weight: bold;
  margin: 20px 0;
  letter-spacing: 1px;
}

.payment-method {
  background: #0b1b30;
  border-radius: 12px;
  padding: 15px;
  margin: 10px 0;
}

input,
select {
  width: 100%;
  padding: 15px;
  border-radius: 10px;
  border: none;
  margin: 7px 0 15px;
  font-size: 16px;
}

/* ODDS */

.odd {
  background: #0d2038;
  border-radius: 12px;
  padding: 17px;
  margin: 10px 0;

  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.match {
  font-size: 18px;
  font-weight: bold;
}

.pick {
  color: #aebed0;
  margin-top: 6px;
}

.league {
  color: #25d98a;
  font-size: 13px;
  margin-top: 5px;
}

.odd-number {
  color: #ffc107;
  font-size: 25px;
  font-weight: bold;
}

/* ADMIN */

.admin-box {
  background: #0c1c31;
  border-radius: 12px;
  padding: 15px;
  margin: 10px 0;
}

.status {
  padding: 12px;
  border-radius: 8px;
  margin-top: 10px;
}

.success {
  background: #123d2b;
  color: #45e59b;
}

.error {
  background: #4b1820;
  color: #ff8993;
}

.warning {
  background: #4a3910;
  color: #ffd35a;
}

/* FOOTER */

footer {
  text-align: center;
  color: #8493a5;
  padding: 30px 15px;
}

/* MOBILE */

@media(max-width:600px) {

  .logo {
    font-size: 30px;
  }

  .subtitle {
    font-size: 17px;
  }

  .hero h1 {
    font-size: 38px;
  }

  .hero p {
    font-size: 18px;
  }

  .payment-number {
    font-size: 27px;
  }

  .nav button {
    font-size: 15px;
    padding: 12px 14px;
  }

}

</style>

</head>

<body>

<!-- HEADER -->

<header class="header">

<div class="logo">
⚽ YUSUPHU ODDS VIP
</div>

<div class="subtitle">
Free Odds • VIP TSh 5,000 • Bet Slip Calculator
</div>

</header>


<!-- NAV -->

<nav class="nav">

<button onclick="showPage('home')">
🏠 HOME
</button>

<button onclick="showPage('free')">
🆓 FREE ODDS
</button>

<button onclick="showPage('vip')">
⭐ VIP
</button>

<button onclick="showPage('slip')">
🎟️ MKEKA
</button>

<button onclick="showPage('payment')">
💳 LIPA 5,000
</button>

<button onclick="showPage('admin')">
🔐 ADMIN
</button>

</nav>


<main class="container">


<!-- HOME -->

<section id="home" class="page active">

<div class="card hero">

<div class="hero-small">
VIP FOOTBALL PREDICTIONS
</div>

<h1>
Karibu YUSUPHU ODDS VIP
</h1>

<p>
Jiunge na huduma ya VIP Odds kwa
TSh 5,000.
</p>

<button
class="btn green"
onclick="showPage('payment')">

💳 LIPA TSh 5,000

</button>

</div>


<div class="card">

<h2>
💳 JINSI YA KULIPA
</h2>

<p>
Lipa TSh 5,000 kwenda kwenye namba:
</p>

<div class="payment-number">
📱 0793401886
</div>

<p>
Baada ya kufanya malipo, utapokea
<strong>Reference / Transaction ID</strong>
kwenye SMS yako.
</p>

<button
class="btn green"
onclick="showPage('payment')">

NIMEFANYA MALIPO

</button>

</div>


<div class="card">

<h2>
🆓 ODDS ZA KWANZA BURE
</h2>

<p>
Kabla hujalipia VIP, unaweza kuona
odds za kwanza bure.
</p>

<button
class="btn blue"
onclick="showPage('free')">

ANGALIA FREE ODDS

</button>

</div>


<div class="card">

<h3>
🔞 18+ Responsible Gambling
</h3>

<p>
Usibeti zaidi ya uwezo wako.
Mfumo huu hautoi bet moja kwa moja
kwa kampuni za betting.
</p>

</div>

</section>


<!-- FREE ODDS -->

<section id="free" class="page">

<div class="card">

<h2>
🆓 FREE ODDS
</h2>

<p>
Hizi ni odds za kwanza bure.
</p>

<div id="freeOdds">
Inapakia...
</div>

</div>

</section>


<!-- VIP -->

<section id="vip" class="page">

<div class="card">

<h2>
⭐ VIP ODDS
</h2>

<div id="vipLocked">

<div class="status warning">

🔒 VIP imefungwa.

<br><br>

Lipa TSh 5,000 na tuma
Payment Reference ili Admin athibitishe.

</div>

<button
class="btn green"
onclick="showPage('payment')">

💳 LIPA TSh 5,000

</button>

</div>


<div
id="vipContent"
style="display:none;">

<div id="vipOdds">
Inapakia...
</div>

</div>

</div>

</section>


<!-- PAYMENT -->

<section id="payment" class="page">

<div class="card">

<h2>
💳 MALIPO YA VIP
</h2>

<h3>
Kiasi: TSh 5,000
</h3>


<div class="payment-method">

<strong>
📱 M-PESA
</strong>

<br>

0793401886

</div>


<div class="payment-method">

<strong>
📱 AIRTEL MONEY
</strong>

<br>

0692359311

</div>


<div class="payment-method">

<strong>
📱 HALOPESA
</strong>

<br>

0613431930

</div>


<div class="payment-method">

<strong>
💳 CARD
</strong>

<br>

Visa/Card payment information
itaonyeshwa kupitia njia salama ya
payment gateway.

</div>


<p>
Baada ya kulipa, weka
<strong>Payment Reference / Transaction ID</strong>
hapa:
</p>


<form onsubmit="sendPayment(event)">

<input
id="reference"
placeholder="Mfano: MPESA123456"
required
>

<button class="btn green">
NIMEFANYA MALIPO
</button>

</form>


<div id="paymentMessage"></div>

</div>

</section>


<!-- MKEKA -->

<section id="slip" class="page">

<div class="card">

<h2>
🎟️ MKeka / BET SLIP
</h2>

<p>
Chagua odds kisha ongeza kwenye mkeka.
</p>

<div id="slipList">

Hakuna selections.

</div>

<hr>

<h3>
Total Odds:
<span id="totalOdds">
1.00
</span>
</h3>


<input
id="stake"
type="number"
placeholder="Stake mfano 1000"
oninput="calculate()"
>


<h3>
Possible Return:
TSh <span id="possibleReturn">
0.00
</span>
</h3>


<button
class="btn red"
onclick="clearSlip()">

FUTA MKeka

</button>

</div>


<div class="card">

<h3>
📋 Bet Code
</h3>

<p>
Unaweza kuweka Bet Code yako hapa
kwa ajili ya kumbukumbu.
</p>

<input
id="betCode"
placeholder="Weka Bet Code"
>

<button
class="btn blue"
onclick="saveBetCode()">

HIFADHI BET CODE

</button>

<div id="betCodeMessage"></div>

</div>

</section>


<!-- ADMIN -->

<section id="admin" class="page">

<div
id="adminLogin"
class="card">

<h2>
🔐 ADMIN LOGIN
</h2>

<form onsubmit="adminLogin(event)">

<input
id="adminPassword"
type="password"
placeholder="Admin Password"
required
>

<button class="btn yellow">
INGIA ADMIN
</button>

</form>

<div id="adminLoginMessage"></div>

</div>


<div
id="adminPanel"
style="display:none;">

<div class="card">

<h2>
⚙️ ADMIN PANEL
</h2>

<h3>
➕ Ongeza FREE ODDS
</h3>

<form onsubmit="addOdd(event,'free')">

<input
id="freeMatch"
placeholder="Mechi"
required
>

<input
id="freePick"
placeholder="Pick"
required
>

<input
id="freeOdd"
type="number"
step="0.01"
placeholder="Odd"
required
>

<input
id="freeLeague"
placeholder="League"
>

<button class="btn green">
ONGEZA FREE ODDS
</button>

</form>

</div>


<div class="card">

<h3>
⭐ Ongeza VIP ODDS
</h3>

<form onsubmit="addOdd(event,'vip')">

<input
id="vipMatch"
placeholder="Mechi"
required
>

<input
id="vipPick"
placeholder="Pick"
required
>

<input
id="vipOdd"
type="number"
step="0.01"
placeholder="Odd"
required
>

<input
id="vipLeague"
placeholder="League"
>

<button class="btn yellow">
ONGEZA VIP ODDS
</button>

</form>

</div>


<div class="card">

<h3>
📋 ODDS ZILIZOPO
</h3>

<div id="adminOdds">
Inapakia...
</div>

</div>


<div class="card">

<h3>
💰 MALIPO YA WATEJA
</h3>

<div id="adminPayments">
Inapakia...
</div>

</div>

</div>

</section>

</main>


<footer>

YUSUPHU ODDS VIP © 2026

</footer>


<script>

let adminToken =
sessionStorage.getItem("yusuphuAdminToken") || "";

let vipUnlocked =
sessionStorage.getItem("yusuphuVip") === "1";

let slip =
JSON.parse(
localStorage.getItem("yusuphuSlip") || "[]"
);


// =================================
// PAGE NAVIGATION
// =================================

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(function(section) {

      section.classList.remove("active");

    });

  document
    .getElementById(page)
    .classList.add("active");


  if (page === "free") {
    loadFreeOdds();
  }

  if (page === "vip") {
    loadVipOdds();
  }

  if (page === "slip") {
    renderSlip();
  }

  if (page === "admin") {

    if (adminToken) {

      openAdmin();

    }

  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// =================================
// ESCAPE HTML
// =================================

function escapeHtml(value) {

  return String(value || "")
    .replace(/[&<>"']/g, function(c) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c];

    });

}


// =================================
// ODDS CARD
// =================================

function oddsCard(o) {

  return `

  <div class="odd">

    <div>

      <div class="match">
        ${escapeHtml(o.match)}
      </div>

      <div class="pick">
        ${escapeHtml(o.pick)}
      </div>

      <div class="league">
        ${escapeHtml(o.league || "Football")}
      </div>

    </div>


    <div>

      <div class="odd-number">
        ${Number(o.odd).toFixed(2)}
      </div>

      <button
      class="btn green"
      onclick='addToSlip(
        ${JSON.stringify(o)}
      )'>

      + MKEKA

      </button>

    </div>

  </div>

  `;

}


// =================================
// FREE ODDS
// =================================

async function loadFreeOdds() {

  const response =
    await fetch("/api/free-odds");

  const data =
    await response.json();

  document.getElementById(
    "freeOdds"
  ).innerHTML =

    data.map(oddsCard).join("") ||

    "<p>Hakuna odds kwa sasa.</p>";

}


// =================================
// VIP ODDS
// =================================

async function loadVipOdds() {

  const locked =
    document.getElementById("vipLocked");

  const content =
    document.getElementById("vipContent");


  if (!vipUnlocked) {

    locked.style.display = "block";

    content.style.display = "none";

    return;

  }


  const response =
    await fetch("/api/vip-odds");

  const data =
    await response.json();


  locked.style.display = "none";

  content.style.display = "block";


  document.getElementById(
    "vipOdds"
  ).innerHTML =

    data.map(oddsCard).join("") ||

    "<p>Hakuna VIP odds kwa sasa.</p>";

}


// =================================
// PAYMENT
// =================================

async function sendPayment(event) {

  event.preventDefault();


  const reference =
    document
      .getElementById("reference")
      .value
      .trim();


  const response =
    await fetch("/api/payment", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        reference: reference
      })

    });


  const data =
    await response.json();


  const box =
    document.getElementById(
      "paymentMessage"
    );


  if (data.success) {

    box.innerHTML = `

      <div class="status success">

      ✅ ${escapeHtml(data.message)}

      <br><br>

      Reference:
      <strong>
      ${escapeHtml(reference)}
      </strong>

      </div>

    `;

    document
      .getElementById("reference")
      .value = "";

  } else {

    box.innerHTML = `

      <div class="status error">

      ❌ ${escapeHtml(
        data.message ||
        "Malipo hayajatumwa."
      )}

      </div>

    `;

  }

}


// =================================
// ADMIN LOGIN
// =================================

async function adminLogin(event) {

  event.preventDefault();


  const password =
    document
      .getElementById("adminPassword")
      .value;


  const response =
    await fetch("/api/admin/login", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        password: password
      })

    });


  const data =
    await response.json();


  if (!data.success) {

    document
      .getElementById(
        "adminLoginMessage"
      )
      .innerHTML = `

      <div class="status error">

      ❌ Password sio sahihi.

      </div>

      `;

    return;

  }


  adminToken =
    data.token;


  sessionStorage.setItem(
    "yusuphuAdminToken",
    adminToken
  );


  openAdmin();

}


// =================================
// OPEN ADMIN
// =================================

function openAdmin() {

  document
    .getElementById("adminLogin")
    .style.display = "none";


  document
    .getElementById("adminPanel")
    .style.display = "block";


  loadAdmin();

}


// =================================
// ADD ODDS
// =================================

async function addOdd(event, type) {

  event.preventDefault();


  let data;


  if (type === "free") {

    data = {

      match:
        document.getElementById(
          "freeMatch"
        ).value,

      pick:
        document.getElementById(
          "freePick"
        ).value,

      odd:
        document.getElementById(
          "freeOdd"
        ).value,

      league:
        document.getElementById(
          "freeLeague"
        ).value

    };

  } else {

    data = {

      match:
        document.getElementById(
          "vipMatch"
        ).value,

      pick:
        document.getElementById(
          "vipPick"
        ).value,

      odd:
        document.getElementById(
          "vipOdd"
        ).value,

      league:
        document.getElementById(
          "vipLeague"
        ).value

    };

  }


  const response =
    await fetch(
      "/api/odds/" + type,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            "Bearer " +
            adminToken

        },

        body:
          JSON.stringify(data)

      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    alert(
      result.error ||
      "Imeshindikana."
    );

    return;

  }


  event.target.reset();

  alert(
    "✅ Odd imeongezwa."
  );


  loadAdmin();

}


// =================================
// LOAD ADMIN
// =================================

async function loadAdmin() {

  const headers = {

    "Authorization":
      "Bearer " +
      adminToken

  };


  const freeResponse =
    await fetch(
      "/api/free-odds"
    );

  const free =
    await freeResponse.json();


  const vipResponse =
    await fetch(
      "/api/vip-odds"
    );

  const vip =
    await vipResponse.json();


  const paymentResponse =
    await fetch(
      "/api/payments",
      {
        headers: headers
      }
    );


  const payments =
    await paymentResponse.json();


  let html = "";


  free.forEach(function(o) {

    html += `

    <div class="admin-box">

      🆓
      <strong>
      ${escapeHtml(o.match)}
      </strong>

      <br>

      ${escapeHtml(o.pick)}
      —
      ${Number(o.odd).toFixed(2)}

      <br><br>

      <button
      class="btn red"
      onclick="deleteOdd(
        'free',
        ${o.id}
      )">

      FUTA

      </button>

    </div>

    `;

  });


  vip.forEach(function(o) {

    html += `

    <div class="admin-box">

      ⭐
      <strong>
      ${escapeHtml(o.match)}
      </strong>

      <br>

      ${escapeHtml(o.pick)}
      —
      ${Number(o.odd).toFixed(2)}

      <br><br>

      <button
      class="btn red"
      onclick="deleteOdd(
        'vip',
        ${o.id}
      )">

      FUTA

      </button>

    </div>

    `;

  });


  document.getElementById(
    "adminOdds"
  ).innerHTML = html;


  let paymentHtml = "";


  if (!Array.isArray(payments)) {

    paymentHtml =
      "<p>Session ya Admin imeisha. Ingia tena.</p>";

  } else if (
    payments.length === 0
  ) {

    paymentHtml =
      "<p>Hakuna malipo mapya.</p>";

  } else {

    payments.forEach(function(p) {

      paymentHtml += `

      <div class="admin-box">

      <strong>
      Reference:
      </strong>

      ${escapeHtml(
        p.reference
      )}

      <br>

      Kiasi:
      TSh ${Number(
        p.amount
      ).toLocaleString()}

      <br>

      Status:
      <strong>
      ${escapeHtml(
        p.status
      )}
      </strong>

      <br><br>

      <button
      class="btn green"
      onclick="approvePayment(
        ${p.id}
      )">

      IDHINISHA

      </button>


      <button
      class="btn red"
      onclick="rejectPayment(
        ${p.id}
      )">

      KATAA

      </button>

      </div>

      `;

    });

  }


  document.getElementById(
    "adminPayments"
  ).innerHTML =
    paymentHtml;

}


// =================================
// DELETE ODDS
// =================================

async function deleteOdd(
  type,
  id
) {

  if (
    !confirm(
      "Unataka kufuta odd hii?"
    )
  ) {

    return;

  }


  await fetch(
    "/api/odds/" +
    type +
    "/" +
    id,
    {

      method: "DELETE",

      headers: {

        "Authorization":
          "Bearer " +
          adminToken

      }

    }
  );


  loadAdmin();

}


// =================================
// APPROVE PAYMENT
// =================================

async function approvePayment(id) {

  await fetch(
    "/api/payments/" +
    id +
    "/approve",
    {

      method: "POST",

      headers: {

        "Authorization":
          "Bearer " +
          adminToken

      }

    }
  );


  alert(
    "✅ Malipo yameidhinishwa."
  );


  loadAdmin();

}


// =================================
// REJECT PAYMENT
// =================================

async function rejectPayment(id) {

  await fetch(
    "/api/payments/" +
    id +
    "/reject",
    {

      method: "POST",

      headers: {

        "Authorization":
          "Bearer " +
          adminToken

      }

    }
  );


  alert(
    "Malipo yamekataliwa."
  );


  loadAdmin();

}


// =================================
// MKEKA
// =================================

function addToSlip(odd) {

  slip.push({

    id: odd.id,

    match: odd.match,

    pick: odd.pick,

    odd: Number(odd.odd)

  });


  localStorage.setItem(
    "yusuphuSlip",
    JSON.stringify(slip)
  );


  alert(
    "✅ Imeongezwa kwenye mkeka."
  );

}


// =================================
// RENDER SLIP
// =================================

function renderSlip() {

  const box =
    document.getElementById(
      "slipList"
    );


  if (slip.length === 0) {

    box.innerHTML =
      "<p>Hakuna selections.</p>";

    calculate();

    return;

  }


  box.innerHTML =
    slip.map(
      function(item, index) {

        return `

        <div class="odd">

          <div>

            <div class="match">
            ${escapeHtml(
              item.match
            )}
            </div>

            <div class="pick">
            ${escapeHtml(
              item.pick
            )}
            </div>

          </div>


          <div>

            <div class="odd-number">

            ${Number(
              item.odd
            ).toFixed(2)}

            </div>


            <button
            class="btn red"
            onclick="removeSlip(
              ${index}
            )">

            FUTA

            </button>

          </div>

        </div>

        `;

      }
    )
    .join("");


  calculate();

}


// =================================
// REMOVE SLIP
// =================================

function removeSlip(index) {

  slip.splice(
    index,
    1
  );


  localStorage.setItem(
    "yusuphuSlip",
    JSON.stringify(slip)
  );


  renderSlip();

}


// =================================
// CLEAR SLIP
// =================================

function clearSlip() {

  slip = [];


  localStorage.removeItem(
    "yusuphuSlip"
  );


  renderSlip();

}


// =================================
// CALCULATE
// =================================

function calculate() {

  let total = 1;


  slip.forEach(
    function(item) {

      total *=
        Number(item.odd);

    }
  );


  document.getElementById(
    "totalOdds"
  ).textContent =
    total.toFixed(2);


  const stake =
    Number(
      document.getElementById(
        "stake"
      ).value || 0
    );


  document.getElementById(
    "possibleReturn"
  ).textContent =
    (stake * total)
      .toFixed(2);

}


// =================================
// BET CODE
// =================================

function saveBetCode() {

  const code =
    document.getElementById(
      "betCode"
    ).value
    .trim();


  if (!code) {

    return;

  }


  localStorage.setItem(
    "yusuphuBetCode",
    code
  );


  document.getElementById(
    "betCodeMessage"
  ).innerHTML = `

  <div class="status success">

  ✅ Bet Code imehifadhiwa.

  </div>

  `;

}


// =================================
// INITIAL
// =================================

loadFreeOdds();

renderSlip();

if (vipUnlocked) {

  loadVipOdds();

}

</script>

</body>

</html>

`);

});


// =================================
// API HEALTH
// =================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      ok: true,

      app:
        APP_NAME

    });

  }
);


// =================================
// GET FREE ODDS
// =================================

app.get(
  "/api/free-odds",
  (req, res) => {

    res.json(
      freeOdds
    );

  }
);


// =================================
// GET VIP ODDS
// =================================

app.get(
  "/api/vip-odds",
  (req, res) => {

    res.json(
      vipOdds
    );

  }
);


// =================================
// ADMIN LOGIN
// =================================

app.post(
  "/api/admin/login",
  (req, res) => {

    const password =
      String(
        req.body.password || ""
      );


    if (
      password !==
      ADMIN_PASSWORD
    ) {

      return res
        .status(401)
        .json({

          success: false,

          message:
            "Password sio sahihi."

        });

    }


    const token =
      Date.now()
        .toString(36) +
      Math.random()
        .toString(36)
        .substring(2);


    adminTokens.add(
      token
    );


    res.json({

      success: true,

      token: token

    });

  }
);


// =================================
// PAYMENT
// =================================

app.post(
  "/api/payment",
  (req, res) => {

    const reference =
      String(
        req.body.reference || ""
      ).trim();


    if (!reference) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Weka Payment Reference."

        });

    }


    const payment = {

      id: Date.now(),

      reference:
        reference,

      amount:
        VIP_PRICE,

      status:
        "PENDING",

      phone:
        MPESA,

      createdAt:
        new Date().toISOString()

    };


    payments.unshift(
      payment
    );


    res.json({

      success: true,

      message:
        "Malipo yamepokelewa. Subiri Admin athibitishe.",

      paymentId:
        payment.id

    });

  }
);


// =================================
// GET PAYMENTS
// =================================

app.get(
  "/api/payments",
  requireAdmin,
  (req, res) => {

    res.json(
      payments
    );

  }
);


// =================================
// ADD FREE ODDS
// =================================

app.post(
  "/api/odds/free",
  requireAdmin,
  (req, res) => {

    const {
      match,
      pick,
      odd,
      league
    } = req.body;


    if (
      !match ||
      !pick ||
      !odd
    ) {

      return res
        .status(400)
        .json({

          error:
            "Jaza mechi, pick na odd."

        });

    }


    const item = {

      id: Date.now(),

      match:
        match,

      pick:
        pick,

      odd:
        Number(odd),

      league:
        league ||
        "Football"

    };


    freeOdds.unshift(
      item
    );


    res
      .status(201)
      .json(item);

  }
);


// =================================
// ADD VIP ODDS
// =================================

app.post(
  "/api/odds/vip",
  requireAdmin,
  (req, res) => {

    const {
      match,
      pick,
      odd,
      league
    } = req.body;


    if (
      !match ||
      !pick ||
      !odd
    ) {

      return res
        .status(400)
        .json({

          error:
            "Jaza mechi, pick na odd."

        });

    }


    const item = {

      id: Date.now(),

      match:
        match,

      pick:
        pick,

      odd:
        Number(odd),

      league:
        league ||
        "Football"

    };


    vipOdds.unshift(
      item
    );


    res
      .status(201)
      .json(item);

  }
);


// =================================
// DELETE FREE ODDS
// =================================

app.delete(
  "/api/odds/free/:id",
  requireAdmin,
  (req, res) => {

    const id =
      Number(
        req.params.id
      );


    const before =
      freeOdds.length;


    freeOdds =
      freeOdds.filter(
        item =>
          item.id !== id
      );


    if (
      freeOdds.length ===
      before
    ) {

      return res
        .status(404)
        .json({

          error:
            "Odd haijapatikana."

        });

    }


    res.json({
      success: true
    });

  }
);


// =================================
// DELETE VIP ODDS
// =================================

app.delete(
  "/api/odds/vip/:id",
  requireAdmin,
  (req, res) => {

    const id =
      Number(
        req.params.id
      );


    const before =
      vipOdds.length;


    vipOdds =
      vipOdds.filter(
        item =>
          item.id !== id
      );


    if (
      vipOdds.length ===
      before
    ) {

      return res
        .status(404)
        .json({

          error:
            "Odd haijapatikana."

        });

    }


    res.json({
      success: true
    });

  }
);


// =================================
// APPROVE PAYMENT
// =================================

app.post(
  "/api/payments/:id/approve",
  requireAdmin,
  (req, res) => {

    const id =
      Number(
        req.params.id
      );


    const payment =
      payments.find(
        item =>
          item.id === id
      );


    if (!payment) {

      return res
        .status(404)
        .json({

          error:
            "Malipo hayajapatikana."

        });

    }


    payment.status =
      "APPROVED";


    res.json(
      payment
    );

  }
);


// =================================
// REJECT PAYMENT
// =================================

app.post(
  "/api/payments/:id/reject",
  requireAdmin,
  (req, res) => {

    const id =
      Number(
        req.params.id
      );


    const payment =
      payments.find(
        item =>
          item.id === id
      );


    if (!payment) {

      return res
        .status(404)
        .json({

          error:
            "Malipo hayajapatikana."

        });

    }


    payment.status =
      "REJECTED";


    res.json(
      payment
    );

  }
);


// =================================
// START SERVER
// =================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      APP_NAME +
      " running on port " +
      PORT
    );

  }
);
