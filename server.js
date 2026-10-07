const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let payments = [];
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

const html = `<!doctype html>
<html lang="sw">
<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width,initial-scale=1">

<title>YUSUPHU ODDS VIP</title>

<style>

*{
box-sizing:border-box
}

body{
margin:0;
background:#07111f;
color:#fff;
font-family:Arial,sans-serif
}

.top{
padding:15px 5%;
background:#0b1728;
display:flex;
justify-content:space-between;
gap:10px;
flex-wrap:wrap;
border-bottom:1px solid #20324a
}

.brand{
font-size:21px;
font-weight:900
}

.brand b{
color:#29d17d
}

.nav button{
background:none;
border:0;
color:#fff;
padding:8px;
cursor:pointer
}

.page{
display:none;
max-width:1050px;
margin:auto;
padding:30px 5%
}

.active{
display:block
}

.hero,.box,.card,.odd,.admin{
background:#0d1b2d;
border:1px solid #20324a;
border-radius:18px;
padding:25px
}

.hero{
background:linear-gradient(135deg,#12365a,#07111f);
padding:45px 30px
}

.tag{
color:#29d17d;
font-weight:bold;
letter-spacing:1px
}

h1{
font-size:clamp(38px,8vw,70px);
line-height:1;
margin:12px 0
}

h2{
font-size:32px
}

.hero p{
color:#cbd5e1;
font-size:18px;
max-width:700px
}

.btn{
background:#29d17d;
border:0;
border-radius:10px;
padding:14px 18px;
font-weight:bold;
cursor:pointer
}

.cards{
display:grid;
grid-template-columns:repeat(3,1fr);
gap:15px;
margin-top:15px
}

.cards p{
color:#aebdce
}

.box{
margin-top:15px
}

.form{
display:grid;
grid-template-columns:1fr 1fr 1fr auto;
gap:10px
}

.form input{
padding:13px;
background:#07111f;
color:#fff;
border:1px solid #2a405b;
border-radius:9px;
width:100%
}

.odds{
display:grid;
gap:12px
}

.odd{
display:flex;
justify-content:space-between;
align-items:center
}

.odd p{
color:#aebdce
}

.value{
font-size:28px;
color:#6ee7a5;
font-weight:bold
}

.admin{
display:flex;
justify-content:space-between;
align-items:center;
margin-top:10px
}

.delete{
background:#351414;
color:#fecaca;
border:1px solid #7f1d1d;
padding:8px;
border-radius:7px
}

.msg{
color:#6ee7a5;
padding:10px
}

.warning{
color:#f6c453
}

footer{
text-align:center;
padding:30px;
color:#718198
}

@media(max-width:700px){

.cards{
grid-template-columns:1fr
}

.form{
grid-template-columns:1fr
}

.odd{
align-items:flex-start;
flex-direction:column
}

}

</style></head>

<body>

<header class="top">

<div class="brand">
YUSUPHU <b>ODDS VIP</b>
</div>

<div class="nav">

<button onclick="show('home')">
🏠 HOME
</button>

<button onclick="show('vip')">
⭐ VIP ODDS
</button>

<button onclick="show('admin')">
⚙️ ADMIN
</button>

</div>

</header>


<section id="home" class="page active">

<div class="hero">

<div class="tag">
VIP FOOTBALL PREDICTIONS
</div>

<h1>
Karibu YUSUPHU ODDS VIP
</h1>

<p>
Jiunge na huduma ya VIP Odds kwa TSh 5,000.
</p>

<button
class="btn"
onclick="document.getElementById('pay').scrollIntoView({behavior:'smooth'})">

💳 LIPA TSh 5,000

</button>

<p>
<div class="box">

<h3>💳 JINSI YA KULIPA</h3>

<p>
Lipa <b>TSh 5,000</b> kwenda kwenye namba:
</p>

<h2>📱 0793401886</h2>

<p>
Baada ya kufanya malipo, utapokea
<b>Reference/Transaction ID</b> kupitia SMS.
</p>

<p>
Kisha bonyeza <b>NIMEFANYA MALIPO</b>
na uweke Reference hiyo kwenye fomu hapa chini.
</p>

</div>


<div class="cards">

<div class="card">

<h3>
💰 Lipa TSh 5,000
</h3>

<p>
Fanya malipo kwa namba rasmi ya huduma.
</p>

</div>


<div class="card">

<h3>
🧾 Reference
</h3>

<p>
Ingiza reference ya muamala wako.
</p>

</div>


<div class="card">

<h3>
⭐ VIP Odds
</h3>

<p>
Angalia odds zako baada ya malipo.
</p>

</div>

</div>


<div id="pay" class="box">

<h2>
💳 NIMEFANYA MALIPO
</h2>

<form
class="form"
onsubmit="pay(event)"
>

<input
id="phone"
placeholder="Namba ya simu iliyolipia"
required
>

<input
id="amount"
type="number"
value="5000"
min="5000"
required
>

<input
id="ref"
placeholder="Reference ya malipo"
required
>

<button class="btn">
TUMA
</button>

</form>

<div id="msg"></div>

</div>

</section>


<section id="vip" class="page">

<div class="tag">
PRIVATE PICKS
</div>

<h2>
⭐ VIP ODDS
</h2>

<div id="odds" class="odds">
</div>

</section>


<section id="admin" class="page">

<div class="tag">
MANAGEMENT
</div>

<h2>
⚙️ ADMIN PANEL
</h2>
<div class="box">

<h3>💳 MALIPO YALIYOWASILISHWA</h3>

<div id="payments">
Hakuna malipo yaliyowasilishwa bado.
</div>

</div>
<div class="box">

<form
class="form"
onsubmit="add(event)"
>

<input
id="match"
placeholder="Match"
required
>

<input
id="pick"
placeholder="Pick"
required
>

<input
id="odd"
type="number"
step="0.01"
placeholder="Odd"
required
>

<button class="btn">
ONGEZA
</button>

</form>


<div id="adminlist">
</div>

</div>

<p class="warning">

⚠️ Admin login/password tutaongeza
katika hatua inayofuata.

</p>

</section>


<footer>

© 2026 YUSUPHU ODDS VIP

</footer<script>

function show(id) {

  document.querySelectorAll(".page").forEach(function(page) {
    page.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "vip") {
    loadOdds();
  }

  if (id === "admin") {
    loadAdmin();
  }

  window.scrollTo(0, 0);
}


async function loadOdds() {

  const response = await fetch("/api/odds");
  const data = await response.json();
const paymentResponse = await fetch("/api/payments");
const paymentData = await paymentResponse.json();

document.getElementById("payments").innerHTML =
  paymentData.payments.map(function(payment) {

    return '<div class="admin">' +
      '<span>' +
      '📱 ' + payment.phone +
      ' | 💰 TSh ' + payment.amount +
      ' | 🧾 ' + payment.reference +
      ' | ⏳ ' + payment.status +
      '</span>' +
      '</div>';

  }).join("");
  document.getElementById("odds").innerHTML =
    data.odds.map(function(item) {

      return '<article class="odd">' +
        '<div>' +
        '<h3>' + item.match + '</h3>' +
        '<p>' + item.pick + ' · ' + item.status + '</p>' +
        '</div>' +
        '<div class="value">' +
        Number(item.odd).toFixed(2) +
        '</div>' +
        '</article>';

    }).join("");
}


async function loadAdmin() {

  const response = await fetch("/api/odds");
  const data = await response.json();

  document.getElementById("adminlist").innerHTML =
    data.odds.map(function(item) {

      return '<div class="admin">' +
        '<span>' +
        item.match +
        ' — ' +
        item.pick +
        ' — ' +
        Number(item.odd).toFixed(2) +
        '</span>' +

        '<button class="delete" onclick="deleteOdd(' +
        item.id +
        ')">' +
        'Futa' +
        '</button>' +

        '</div>';

    }).join("");
}


async function add(event) {

  event.preventDefault();

  const response = await fetch("/api/odds", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({

      match: document.getElementById("match").value,

      pick: document.getElementById("pick").value,

      odd: document.getElementById("odd").value

    })

  });

  const data = await response.json();

  if (!response.ok) {

    alert(data.message || "Imeshindikana.");

    return;
  }

  event.target.reset();

  loadAdmin();
}


async function deleteOdd(id) {

  const response = await fetch(
    "/api/odds/" + id,
    {
      method: "DELETE"
    }
  );

  if (response.ok) {
    loadAdmin();
  }

}


async function pay(event) {

  event.preventDefault();

  const response = await fetch(
    "/api/payment/verify",
    {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({

        phone:
          document.getElementById("phone").value,

        amount:
          Number(
            document.getElementById("amount").value
          ),

        reference:
          document.getElementById("ref").value

      })

    }
  );

  const data = await response.json();

  if (data.success) {

    document.getElementById("msg").innerHTML =
      '<div class="msg">' +
      '✅ Taarifa ya malipo imepokelewa. ' +
      'Reference: ' +
      data.reference +
      '</div>';

    setTimeout(function() {
      show("vip");
    }, 800);

  } else {

    document.getElementById("msg").innerHTML =
      '<div class="msg">❌ ' +
      data.message +
      '</div>';

  }

}


loadOdds();

</script>


</body>
</html>`;


app.get("/", function(req, res) {
  res.send(html);
});


app.get("/api/health", function(req, res) {

  res.json({
    success: true,
    status: "ok",
    app: "YUSUPHU ODDS VIP"
  });

});


app.get("/api/odds", function(req, res) {

  res.json({
    success: true,
    odds: odds
  });

});


app.post("/api/odds", function(req, res) {

  const { match, pick, odd } = req.body;

  if (!match || !pick || !odd) {

    return res.status(400).json({
      success: false,
      message: "Jaza match, pick na odd."
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

  res.status(201).json({
    success: true,
    odd: item
  });

});


app.delete("/api/odds/:id", function(req, res) {

  const id = Number(req.params.id);

  const before = odds.length;

  odds = odds.filter(function(item) {
    return item.id !== id;
  });

  if (before === odds.length) {

    return res.status(404).json({
      success: false,
      message: "Odd haijapatikana."
    });

  }

  res.json({
    success: true,
    message: "Odd imefutwa."
  });

});


app.post("/api/payment/verify", function(req, res) {

  const { phone, amount, reference } = req.body;
const payment = {
  id: Date.now(),
  phone: phone,
  amount: Number(amount),
  reference: reference,
  status: "PENDING"
};

payments.push(payment);
  if (!phone || !amount || !reference) {

    return res.status(400).json({
      success: false,
      message:
        "Jaza namba ya simu, kiasi na reference."
    });

  }

  if (Number(amount) < 5000) {

    return res.status(400).json({
      success: false,
      message:
        "Kiasi kinachotakiwa ni TSh 5,000."
    });

  }

  res.json({

    success: true,

    message:
      "Taarifa ya malipo imepokelewa.",

    phone: phone,

    amount: Number(amount),

    reference: reference

  });app.get("/api/payments", function(req, res) {

  res.json({
    success: true,
    payments: payments
  });

});

});


app.listen(PORT, "0.0.0.0", function() {

  console.log(
    "YUSUPHU ODDS VIP running on port " + PORT
  );

});
