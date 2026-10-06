# YUSUPHU ODDS VIP

Mfumo wa kuuza uchambuzi/VIP odds kwa TSh 5,000.

## Vipengele
- Home page
- Malipo ya TSh 5,000
- Namba ya malipo: 0793401886
- Mteja anatuma transaction reference
- Admin ana-approve/reject malipo
- VIP odds zinafunguka baada ya approval
- Admin anaongeza/kufuta odds
- PostgreSQL database
- Render Blueprint (`render.yaml`)

## Muhimu kuhusu malipo
Hii project ina **manual payment verification**. Haijaunganishwa moja kwa moja na API ya M-Pesa/Airtel Money/Tigo Pesa kwa sababu credentials/provider API hazijatolewa. Admin anaangalia transaction reference na ku-approve.

## Local
1. `npm install`
2. Weka `DATABASE_URL` na `ADMIN_PASSWORD`
3. `npm start`
4. Fungua `http://localhost:10000`

## Render
Project ina `render.yaml` yenye web service + PostgreSQL. Baada ya kuweka repo GitHub, Render inaweza kusoma Blueprint hiyo. Weka `ADMIN_PASSWORD` kwenye Render kama secret.

Admin: `/admin.html`
