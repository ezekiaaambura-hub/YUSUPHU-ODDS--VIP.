const express=require("express");
const fs=require("fs");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"YUSUPHU2026";
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

const dataDir=path.join(__dirname,"data"), dataFile=path.join(dataDir,"store.json");
const initial=()=>({payments:[],odds:[{id:1,title:"ODDS ZA KWANZA BURE",matches:["Manchester United — Double Chance","Barcelona — Over 1.5 Goals","Real Madrid — To Win"]}]});
function load(){try{if(!fs.existsSync(dataDir))fs.mkdirSync(dataDir,{recursive:true});if(!fs.existsSync(dataFile)){let x=initial();fs.writeFileSync(dataFile,JSON.stringify(x,null,2));return x}return JSON.parse(fs.readFileSync(dataFile,"utf8"))}catch(e){console.error(e);return initial()}}
let store=load();
function save(){try{if(!fs.existsSync(dataDir))fs.mkdirSync(dataDir,{recursive:true});fs.writeFileSync(dataFile,JSON.stringify(store,null,2))}catch(e){console.error(e)}}
function auth(req,res,next){if(req.headers["x-admin-password"]!==ADMIN_PASSWORD)return res.status(401).json({success:false,message:"Password ya Admin si sahihi."});next()}

app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.get("/api/health",(req,res)=>res.json({success:true,message:"YUSUPHU ODDS VIP iko Live."}));

app.post("/api/payment",(req,res)=>{
 const reference=String(req.body.reference||"").trim(),method=String(req.body.method||"").trim();
 if(!method)return res.status(400).json({success:false,message:"Chagua njia ya malipo."});
 if(!reference)return res.status(400).json({success:false,message:"Weka Payment Reference."});
 if(reference.length<3)return res.status(400).json({success:false,message:"Payment Reference ni fupi."});
 if(store.payments.some(p=>p.reference.toLowerCase()===reference.toLowerCase()))
  return res.status(409).json({success:false,message:"Payment Reference hii tayari imewasilishwa."});
 const payment={id:Date.now(),reference,method,amount:5000,status:"pending",createdAt:new Date().toISOString()};
 store.payments.unshift(payment);save();
 res.json({success:true,message:"Malipo yamepokelewa. Subiri Admin athibitishe.",payment});
});

app.get("/api/payment/:reference",(req,res)=>{
 const p=store.payments.find(x=>x.reference.toLowerCase()===String(req.params.reference).toLowerCase());
 if(!p)return res.status(404).json({success:false,message:"Payment Reference haijapatikana."});
 res.json({success:true,payment:p});
});

app.get("/api/vip/:reference",(req,res)=>{
 const p=store.payments.find(x=>x.reference.toLowerCase()===String(req.params.reference).toLowerCase()&&x.status==="approved");
 if(!p)return res.status(403).json({success:false,message:"VIP bado haijafunguliwa. Subiri Admin athibitishe malipo."});
 res.json({success:true,message:"VIP imefunguliwa.",odds:store.odds});
});

app.get("/api/admin/payments",auth,(req,res)=>res.json({success:true,payments:store.payments}));
app.post("/api/admin/payments/:id/approve",auth,(req,res)=>{
 const p=store.payments.find(x=>x.id===Number(req.params.id));
 if(!p)return res.status(404).json({success:false,message:"Malipo hayajapatikana."});
 p.status="approved";p.approvedAt=new Date().toISOString();save();
 res.json({success:true,message:"Malipo yame-approve. VIP imefunguliwa.",payment:p});
});
app.post("/api/admin/payments/:id/reject",auth,(req,res)=>{
 const p=store.payments.find(x=>x.id===Number(req.params.id));
 if(!p)return res.status(404).json({success:false,message:"Malipo hayajapatikana."});
 p.status="rejected";p.rejectedAt=new Date().toISOString();save();
 res.json({success:true,message:"Malipo yamekataliwa.",payment:p});
});
app.post("/api/admin/odds",auth,(req,res)=>{
 const title=String(req.body.title||"").trim();
 const matches=Array.isArray(req.body.matches)?req.body.matches.map(x=>String(x).trim()).filter(Boolean):[];
 if(!title||!matches.length)return res.status(400).json({success:false,message:"Weka jina la odds na angalau odds moja."});
 const item={id:Date.now(),title,matches,createdAt:new Date().toISOString()};
 store.odds.unshift(item);save();
 res.json({success:true,message:"Odds zimeongezwa.",odds:item});
});
app.get("/api/admin/odds",auth,(req,res)=>res.json({success:true,odds:store.odds}));

app.listen(PORT,"0.0.0.0",()=>console.log("YUSUPHU ODDS VIP running on "+PORT));
