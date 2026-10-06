async function post(url, data, token){
  const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify(data)});
  const j = await r.json(); if(!r.ok) throw new Error(j.error||"Request failed"); return j;
}
async function loadConfig(){
  const j=await fetch("/api/config").then(r=>r.json());
  document.getElementById("paymentPhone").textContent=j.paymentPhone;
}
document.getElementById("paymentForm").addEventListener("submit",async e=>{
  e.preventDefault(); const f=new FormData(e.target);
  try{const j=await post("/api/payments",Object.fromEntries(f));document.getElementById("paymentMsg").textContent=j.message;e.target.reset();}
  catch(err){document.getElementById("paymentMsg").textContent=err.message;}
});
document.getElementById("unlockForm").addEventListener("submit",async e=>{
  e.preventDefault(); const f=new FormData(e.target);
  try{
    const j=await post("/api/vip/unlock",Object.fromEntries(f));
    localStorage.setItem("vipToken",j.token);
    document.getElementById("unlockMsg").textContent="VIP imefunguliwa. Karibu "+j.name+"!";
    const odds=await fetch("/api/vip/odds",{headers:{Authorization:"Bearer "+j.token}}).then(r=>r.json());
    document.getElementById("vip").classList.remove("hidden");
    document.getElementById("oddsList").innerHTML=odds.map(o=>`<div class="odd"><b>${o.match}</b><br>${o.market}: ${o.selection}<div class="oddv">${o.odd}</div><small>${o.analysis||""}</small></div>`).join("") || "<p>Hakuna odds zilizowekwa bado.</p>";
  }catch(err){document.getElementById("unlockMsg").textContent=err.message;}
});
loadConfig();