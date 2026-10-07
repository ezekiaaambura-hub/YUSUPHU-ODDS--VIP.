# YUSUPHU ODDS VIP

Prototype ya mfumo wa YUSUPHU ODDS VIP.

## Vipengele vya mwanzo
- Express server
- API ya kuonyesha odds
- Payment verification endpoint
- CORS
- Ready kwa deployment kwenye Render

## Kuendesha
```bash
npm install
npm start
```

Server itatumia PORT ya Render au port 3000.

## API
- `GET /api/health`
- `GET /api/odds`
- `POST /api/payment/verify`

> Payment halisi haijaunganishwa bado. Endpoint ya payment ni prototype na inahitaji provider/API halali kabla ya kutumika kwa malipo halisi.app.use(express.static("public"));app.get("/", (req, res) => {
  res.send(`
    <h1>YUSUPHU ODDS VIP</h1>
    <p>Karibu kwenye YUSUPHU ODDS VIP</p>
    <p>Server iko ONLINE ✅</p>
  `);
});app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`
    <h1>YUSUPHU ODDS VIP</h1>
    <p>Karibu kwenye YUSUPHU ODDS VIP</p>
    <p>Server iko ONLINE ✅</p>
  `);
});
