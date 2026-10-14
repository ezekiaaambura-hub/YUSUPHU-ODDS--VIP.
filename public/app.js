(() => {
  "use strict";

  let selectedMethod = "";
  let adminToken = "";
  let adminData = null;
  const $ = id => document.getElementById(id);

  async function api(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    if (adminToken && url.startsWith("/api/admin/")) headers.Authorization = "Bearer " + adminToken;
    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      throw new Error("Server haipatikani. Hakikisha Render inaonyesha Live, kisha jaribu tena.");
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false) throw new Error(body.message || "Ombi halijafanikiwa.");
    return body;
  }

  function message(id, text, isError = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = text || "";
    el.classList.toggle("error", Boolean(isError));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function showPage(page) {
    document.querySelectorAll(".page").forEach(el => el.classList.toggle("active", el.id === page));
    document.querySelectorAll(".nav-button").forEach(el => el.classList.toggle("active", el.dataset.page === page));
    $("mainNav").classList.remove("open");
    if (page === "free") loadFreeOdds();
    if (page === "admin" && adminToken) loadAdminData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll("[data-page]").forEach(el => {
    el.addEventListener("click", event => {
      event.preventDefault();
      showPage(el.dataset.page);
    });
  });
  $("menuToggle").addEventListener("click", () => $("mainNav").classList.toggle("open"));
if ($("year")) $("year").textContent = new Date().getFullYear();
  async function loadFreeOdds() {
    $("freeOddsList").innerHTML = '<div class="loading">Inapakia odds...</div>';
    try {
      const odds = await api("/api/odds");
      renderOdds($("freeOddsList"), odds, "Hakuna Free Odds kwa sasa.");
    } catch (error) {
      $("freeOddsList").innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
    }
  }

  function renderOdds(target, odds, emptyText) {
    if (!Array.isArray(odds) || !odds.length) {
      target.innerHTML = `<div class="empty">${escapeHtml(emptyText)}</div>`;
      return;
    }
    target.innerHTML = odds.map(o => `
      <article class="odds-card">
        <div><div class="type-tag">${escapeHtml(o.type)} ODDS</div><h3>${escapeHtml(o.match)}</h3><p>${escapeHtml(o.pick)}</p></div>
        <div class="odd-pill">${Number(o.odd).toFixed(2)}</div>
      </article>`).join("");
  }

  $("refreshFree").addEventListener("click", loadFreeOdds);

  document.querySelectorAll(".network-choice").forEach(button => {
    button.addEventListener("click", () => {
      selectedMethod = button.dataset.method;
      document.querySelectorAll(".network-choice").forEach(b => b.classList.toggle("selected", b === button));
      $("selectedNetwork").textContent = "Umechagua " + selectedMethod + ". Lipa TSh 5,000 kisha weka Payment Reference.";
      message("paymentMessage", "");
    });
  });

  $("paymentForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("paymentMessage", "");
    if (!selectedMethod) return message("paymentMessage", "Tafadhali chagua mtandao wa malipo kwanza.", true);
    const submit = $("paymentForm").querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const result = await api("/api/payment", {
        method: "POST",
        body: JSON.stringify({
          method: selectedMethod,
          phone: $("customerPhone").value.trim(),
          reference: $("paymentReference").value.trim()
        })
      });
      message("paymentMessage", result.message);
      $("vipPhone").value = $("customerPhone").value.trim();
      $("paymentReference").value = "";
    } catch (error) {
      message("paymentMessage", error.message, true);
    } finally {
      submit.disabled = false;
    }
  });

  $("vipCheckForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("vipAccessMessage", "");
    $("vipOddsList").innerHTML = "";
    try {
      const phone = $("vipPhone").value.trim();
      const result = await api("/api/vip/access?phone=" + encodeURIComponent(phone));
      if (!result.access) {
        message("vipAccessMessage", result.message, true);
        return;
      }
      message("vipAccessMessage", "VIP imefunguliwa kwa namba hii.");
      renderOdds($("vipOddsList"), result.odds, "Hakuna VIP Odds zilizowekwa kwa sasa.");
    } catch (error) {
      message("vipAccessMessage", error.message, true);
    }
  });

  $("adminLoginForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("adminLoginMessage", "");
    try {
      const result = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password: $("adminPassword").value })
      });
      adminToken = result.token;
      $("adminPassword").value = "";
      $("adminLoginPanel").classList.add("hidden");
      $("adminDashboard").classList.remove("hidden");
      message("adminLoginMessage", "");
      await loadAdminData();
    } catch (error) {
      message("adminLoginMessage", error.message, true);
    }
  });

  $("adminLogout").addEventListener("click", async () => {
    try { if (adminToken) await api("/api/admin/logout", { method: "POST" }); } catch {}
    adminToken = "";
    adminData = null;
    $("adminDashboard").classList.add("hidden");
    $("adminLoginPanel").classList.remove("hidden");
    message("adminLoginMessage", "Umetoka kwenye Admin.");
  });

  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".admin-pane").forEach(p => p.classList.toggle("active", p.id === tab.dataset.adminTab));
    });
  });

  async function loadAdminData() {
    try {
      adminData = await api("/api/admin/data");
      renderAdminOdds();
      renderAdminPayments();
      fillSettings();
    } catch (error) {
      if (/Admin|kikao/i.test(error.message)) {
        adminToken = "";
        $("adminDashboard").classList.add("hidden");
        $("adminLoginPanel").classList.remove("hidden");
      }
      message("adminLoginMessage", error.message, true);
    }
  }

  function renderAdminOdds() {
    const odds = adminData?.odds || [];
    if (!odds.length) {
      $("adminOddsList").innerHTML = '<div class="empty">Bado hakuna odds.</div>';
      return;
    }
    $("adminOddsList").innerHTML = odds.map(o => `
      <div class="admin-row">
        <div><h4>${escapeHtml(o.match)}</h4><p>${escapeHtml(o.pick)} · Odd ${Number(o.odd).toFixed(2)} · <span class="type-tag">${escapeHtml(o.type)}</span></p></div>
        <div class="admin-actions"><button class="mini-btn" data-edit-odd="${o.id}">Hariri</button><button class="mini-btn reject" data-delete-odd="${o.id}">Futa</button></div>
      </div>`).join("");
    document.querySelectorAll("[data-delete-odd]").forEach(btn => btn.addEventListener("click", () => deleteOdd(btn.dataset.deleteOdd)));
    document.querySelectorAll("[data-edit-odd]").forEach(btn => btn.addEventListener("click", () => editOdd(btn.dataset.editOdd)));
  }

  async function deleteOdd(id) {
    if (!confirm("Una uhakika unataka kufuta odd hii?")) return;
    try {
      await api("/api/admin/odds/" + id, { method: "DELETE" });
      await loadAdminData();
    } catch (error) { alert(error.message); }
  }

  async function editOdd(id) {
    const odd = (adminData?.odds || []).find(o => String(o.id) === String(id));
    if (!odd) return;
    const match = prompt("Jina la mechi:", odd.match);
    if (match === null) return;
    const pick = prompt("Utabiri:", odd.pick);
    if (pick === null) return;
    const oddValue = prompt("Odd:", odd.odd);
    if (oddValue === null) return;
    const type = prompt("Aina: FREE au VIP", odd.type);
    if (type === null) return;
    try {
      await api("/api/admin/odds/" + id, {
        method: "PUT",
        body: JSON.stringify({ match, pick, odd: Number(oddValue), type: type.toUpperCase() })
      });
      await loadAdminData();
    } catch (error) { alert(error.message); }
  }

  $("addOddsForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("addOddsMessage", "");
    try {
      await api("/api/admin/odds", {
        method: "POST",
        body: JSON.stringify({
          match: $("matchName").value.trim(),
          pick: $("prediction").value.trim(),
          odd: Number($("oddValue").value),
          type: $("oddType").value
        })
      });
      $("addOddsForm").reset();
      message("addOddsMessage", "Odd imeongezwa.");
      await loadAdminData();
    } catch (error) {
      message("addOddsMessage", error.message, true);
    }
  });

  function renderAdminPayments() {
    const payments = adminData?.payments || [];
    if (!payments.length) {
      $("adminPaymentsList").innerHTML = '<div class="empty">Bado hakuna maombi ya malipo.</div>';
      return;
    }
    $("adminPaymentsList").innerHTML = payments.map(p => `
      <div class="admin-row">
        <div>
          <h4>${escapeHtml(p.method)} · TSh ${Number(p.amount).toLocaleString("en-US")}</h4>
          <p>Simu ya mteja: ${escapeHtml(p.phone)} · Reference: ${escapeHtml(p.reference)}</p>
          <p>Tarehe: ${escapeHtml(new Date(p.createdAt).toLocaleString("sw-TZ"))}</p>
          <span class="status ${escapeHtml(p.status)}">${escapeHtml(p.status)}</span>
        </div>
        <div class="admin-actions">
          <button class="mini-btn approve" data-payment-status="APPROVED" data-payment-id="${p.id}">Thibitisha</button>
          <button class="mini-btn reject" data-payment-status="REJECTED" data-payment-id="${p.id}">Kataa</button>
          <button class="mini-btn" data-payment-status="PENDING" data-payment-id="${p.id}">Pending</button>
        </div>
      </div>`).join("");
    document.querySelectorAll("[data-payment-status]").forEach(btn => btn.addEventListener("click", () => updatePayment(btn.dataset.paymentId, btn.dataset.paymentStatus)));
  }

  async function updatePayment(id, status) {
    const question = status === "APPROVED"
      ? "Umehakiki muamala halisi na unataka kuidhinisha VIP?"
      : "Unataka kubadilisha hali ya ombi hili?";
    if (!confirm(question)) return;
    try {
      await api("/api/admin/payments/" + id, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadAdminData();
    } catch (error) { alert(error.message); }
  }

  function fillSettings() {
    const s = adminData?.settings;
    if (!s) return;
    $("mpesaNumber").value = s.paymentNumbers["M-Pesa"] || "";
    $("airtelNumber").value = s.paymentNumbers["Airtel Money"] || "";
    $("haloNumber").value = s.paymentNumbers["HaloPesa"] || "";
    $("galLink").value = s.links["GAL Sport"] || "";
    $("betikaLink").value = s.links["Betika"] || "";
    $("adminLinks").innerHTML = `
      <a href="${escapeHtml(s.links["GAL Sport"])}" target="_blank" rel="noopener noreferrer">Fungua GAL Sport ↗</a>
      <a href="${escapeHtml(s.links["Betika"])}" target="_blank" rel="noopener noreferrer">Fungua Betika ↗</a>`;
  }

  $("settingsForm").addEventListener("submit", async event => {
    event.preventDefault();
    message("settingsMessage", "");
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          paymentNumbers: {
            "M-Pesa": $("mpesaNumber").value.trim(),
            "Airtel Money": $("airtelNumber").value.trim(),
            "HaloPesa": $("haloNumber").value.trim()
          },
          links: {
            "GAL Sport": $("galLink").value.trim(),
            "Betika": $("betikaLink").value.trim()
          }
        })
      });
      message("settingsMessage", "Mipangilio imehifadhiwa.");
      await loadAdminData();
    } catch (error) {
      message("settingsMessage", error.message, true);
    }
  });

  api("/api/health").catch(() => {});
  loadFreeOdds();
})();
