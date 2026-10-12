YUSUPHU ODDS VIP — MWONGOZO WA KUANZA

MAFAILI
- server.js
- package.json
- public/index.html
- public/app.js
- public/style.css
- .env.example

KUANZISHA KWENYE RENDER
1. Weka mafaili yote kwenye repository ya GitHub, ukihifadhi public/ kama folder.
2. Render Web Service:
   Build Command: npm install
   Start Command: npm start
3. Kwenye Render > Environment, ongeza:
   ADMIN_PASSWORD = password mpya, imara, unayoijua wewe pekee.
4. Deploy service kisha fungua tovuti.

MUHIMU
- Kama ADMIN_PASSWORD haijawekwa kwenye Render, password ya muda ya kuingia ni BadilishaAdmin123! Badilisha mara moja kwa kuweka Environment Variable.
- Namba za biashara zinaonekana kupitia Admin API tu baada ya kuingia Admin. Wateja wanaona uchaguzi wa mitandao, si namba.
- Admin lazima ahakiki malipo halisi kabla ya kubonyeza Thibitisha. Kutuma reference pekee hakuthibitishi fedha.
- Mfumo huu unahifadhi data kwenye data.json. Render free service inaweza kupoteza data ya faili wakati wa redeploy/restart, kwa sababu disk yake si ya kudumu. Kwa matumizi ya biashara ya muda mrefu, unahitaji database ya kudumu (mfano PostgreSQL) au persistent disk.
- Token za Admin ziko kwenye kumbukumbu ya server; baada ya restart, ingia tena.
- Odds za mwanzo ni mifano tu. Admin abadilishe kwa odds sahihi.
- Hii ni paneli ya kuonyesha odds na kuomba/kuthibitisha malipo kwa mkono; haijaunganishwa na API ya M-Pesa/Airtel/HaloPesa, hivyo haipokei wala kuthibitisha fedha moja kwa moja.
