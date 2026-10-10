/* VBC Hotel Quick Calc — browser JS, zero dependencies. Builds its own UI.
   Include with:  <script src="vbc-hotel.js"></script>
   Optional Firestore: set window.VBC_CONFIG = {projectId:"", apiKey:"", collection:"groups"} before this script. */
(() => {
  const CFG = Object.assign({ projectId: "", apiKey: "", collection: "groups" }, window.VBC_CONFIG || {});
  const WAGE = 17;
  const $ = s => document.querySelector(s);
  const num = v => { const x = parseFloat(String(v).replace(",", ".")); return isNaN(x) ? null : x; };
  const usd = n => "$" + Math.round(n);
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // ---- page setup ----
  document.title = "VBC Hotel";
  [["viewport", "width=device-width,initial-scale=1,viewport-fit=cover"],
   ["apple-mobile-web-app-capable", "yes"],
   ["apple-mobile-web-app-title", "VBC Hotel"]].forEach(([n, c]) => {
    const m = document.createElement("meta"); m.name = n; m.content = c; document.head.appendChild(m);
  });
  const st = document.createElement("style");
  st.textContent = `
  :root{--bg:#f2f2f7;--card:#fff;--tx:#111;--mu:#6b6b76;--ac:#0a60d0;--ok:#1a8f3c;--bad:#c9341f;--ln:#e0e0e6}
  @media(prefers-color-scheme:dark){:root{--bg:#000;--card:#1c1c1e;--tx:#f2f2f7;--mu:#98989f;--ac:#4d9bff;--ok:#43d067;--bad:#ff6b57;--ln:#2c2c2e}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--tx);font:16px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;
    padding:calc(12px + env(safe-area-inset-top,0px)) 12px calc(24px + env(safe-area-inset-bottom,0px))}
  h1{font-size:22px;margin:4px 4px 12px}
  .c{background:var(--card);border-radius:14px;padding:14px;margin-bottom:12px}
  .c h2{font-size:15px;margin:0 0 10px}
  .r{display:flex;gap:8px;margin-bottom:8px}
  .r input{flex:1;min-width:0;width:100%;font-size:22px;padding:10px;border-radius:10px;border:1px solid var(--ln);background:var(--bg);color:var(--tx)}
  .big{font-size:44px;font-weight:700;color:var(--ac);line-height:1.1}
  .m{color:var(--mu);font-size:13px}.ok{color:var(--ok);font-weight:600}.bad{color:var(--bad);font-weight:600}
  table{width:100%;border-collapse:collapse}td{padding:6px 2px;border-bottom:1px solid var(--ln)}td:nth-child(2){text-align:right;font-weight:600}
  td:nth-child(3){text-align:right;color:var(--mu);width:50px}
  button{font-size:16px;padding:10px 14px;border-radius:10px;border:0;background:var(--ac);color:#fff}
  details summary{font-weight:600;cursor:pointer;margin-bottom:8px}
  .doc{border-top:1px solid var(--ln);padding:8px 0;font-size:14px}`;
  document.head.appendChild(st);

  const inp = (id, ph, val) =>
    `<input id="${id}" inputmode="decimal" placeholder="${ph}" value="${val || ""}" autocomplete="off">`;

  document.body.innerHTML = `
  <h1>🏨 VBC Hotel Calc</h1>

  <div class="c"><h2>Day calc</h2>
    <div class="r">${inp("f", "Full Cleans")}${inp("t", "Tidies")}</div>
    <div class="r">${inp("a", "Arrivals")}${inp("d", "Departures")}</div>
    <div id="o1" class="m">Type numbers — results update live.</div>
  </div>

  <div class="c"><h2>Prices &amp; group bids</h2>
    <div class="r">${inp("m", "Comp. Meridian $", LS.get("m", ""))}</div>
    <div class="r">${inp("gs", "Group size")}${inp("go", "Peak occupancy")}</div>
    <div id="o2" class="m">Enter the meridian.</div>
  </div>

  <div class="c"><details><summary>More tools</summary>
    <h2>ICDC pace</h2>
    <div class="r">${inp("pm", "Minutes left")}${inp("pd", "Game days / min")}</div>
    <div id="o3" class="m"></div>
    <h2 style="margin-top:14px">Ad target</h2>
    <div class="r">${inp("ab", "Business %")}${inp("ae", "Events in month")}</div>
    <div id="o4" class="m"></div>
    <h2 style="margin-top:14px">Housekeeper shift (hrs)</h2>
    <div class="r">${inp("sh", "7", LS.get("sh", "7"))}</div>
  </details></div>

  <div class="c"><h2>☁️ Firestore</h2>
    <div class="r"><input id="col" value="${CFG.collection}" autocapitalize="none" autocorrect="off" style="font-size:18px"><button id="load">Load</button></div>
    <div id="cloud" class="m">${CFG.projectId ? "Tap Load." : "Set projectId + apiKey in VBC_CONFIG to enable."}</div>
  </div>`;

  const v = id => num($("#" + id).value);

  function calc() {
    LS.set("m", $("#m").value); LS.set("sh", $("#sh").value);
    const shift = v("sh") || 7;

    // Day: housekeeping + front desk
    const F = v("f"), T = v("t") || 0, A = v("a") || 0, D = v("d") || 0;
    let h = "";
    if (F !== null) {
      const hrs = F + T / 3, n = Math.ceil(hrs / shift - 1e-9);
      h += `<div class="m">Housekeepers</div><div class="big">${n}</div>
            <div class="m">${hrs.toFixed(1)} work-hrs ÷ ${shift}-hr shifts = ${(hrs / shift).toFixed(2)}</div>`;
    }
    if ($("#a").value !== "" || $("#d").value !== "") {
      const ex = [];
      if (A >= 40) ex.push("+1 check-in · 4h around 6–7pm (5–9pm)");
      if (A >= 80) ex.push("+1 more check-in · 4h (3 total)");
      if (D >= 50) ex.push("+1 check-out · 4h around 10am (8am–12pm)");
      const hrs = 19 + ex.length * 4;
      h += `<div style="margin-top:12px"><b>Front desk</b><br>Base: 1 person 5am–12am (5–12, 12–6, 6–12)<br>
            ${ex.length ? ex.join("<br>") : "No extras needed"}<br>
            <b>${hrs} hrs → ${usd(hrs * WAGE)}</b></div>`;
    }
    $("#o1").innerHTML = h || "Type numbers — results update live.";

    // Prices + bids
    const m = v("m");
    if (m === null) { $("#o2").textContent = "Enter the meridian."; }
    else {
      const rows = [["Mon / Tue / Wed", m, ""], ["Thursday", m - 20, ""], ["Fri (no event)", m - 10, ""],
        ["Fri EVENT", m * 1.2, "MS3"], ["Sat after event", m, "MS2"], ["Saturday", m, ""],
        ["Sun after event", m, ""], ["Sun (no event)", m - 20, ""]];
      let t = "<table>" + rows.map(r => `<tr><td>${r[0]}</td><td>${usd(r[1])}${r[0] === "Fri EVENT" ? "+" : ""}</td><td>${r[2]}</td></tr>`).join("") + "</table>";
      t += `<p><b>Group bid / person</b><br>Aggressive ${usd(m - 40)} · Standard ${usd(m - 20)} · Greedy ${usd(m - 15)}</p>`;
      const s = v("gs"), o = v("go");
      if (s !== null && o !== null) {
        const tot = s + o;
        t += tot <= 95 ? `<p class="ok">✅ Fits: ${tot}/95</p>` : `<p class="bad">❌ Won't fit: ${tot}/95 (${tot - 95} over)</p>`;
      }
      t += `<div class="m">Set restrictions before prices. No bids on event weekends.</div>`;
      $("#o2").innerHTML = t;
    }

    // Pace
    const pm = v("pm"), pd = v("pd");
    $("#o3").innerHTML = pm !== null && pd !== null ? `<div class="big" style="font-size:32px">Day ${(pm * pd).toFixed(1)}</div>furthest reachable` : "";

    // Ads
    const ab = v("ab"), ae = v("ae");
    $("#o4").innerHTML = ab === null ? "" :
      `<b>Target ${ab >= 40 ? "BUSINESS" : "LEISURE"}</b> (${ab >= 40 ? "≥" : "<"}40% business)` +
      (ae !== null ? `<br>${ae <= 1 ? "Few events → also push GROUP ads." : "Many events → transients fill weekends."}` : "") +
      "<br>1–2 units per option, favor pricier ones, stay under budget.";
  }

  // ---- Firestore (REST) ----
  const fv = x => { const k = ["stringValue", "integerValue", "doubleValue", "booleanValue", "timestampValue"].find(z => z in x); return k ? x[k] : JSON.stringify(x); };
  async function loadCloud() {
    const box = $("#cloud");
    if (!CFG.projectId || !CFG.apiKey) { box.textContent = "Set projectId + apiKey in VBC_CONFIG."; return; }
    box.textContent = "Loading…";
    try {
      const col = encodeURIComponent($("#col").value.trim());
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${CFG.projectId}/databases/(default)/documents/${col}?pageSize=100&key=${CFG.apiKey}`);
      const j = await r.json();
      if (j.error) { box.textContent = j.error.message; return; }
      const docs = j.documents || [];
      box.innerHTML = docs.length ? docs.map(d =>
        `<div class="doc"><b>${d.name.split("/").pop()}</b><br>` +
        Object.entries(d.fields || {}).map(([k, x]) => `${k}: ${fv(x)}`).join("<br>") + "</div>").join("")
        : "No documents.";
    } catch (e) { box.textContent = "Error: " + e; }
  }

  document.addEventListener("input", calc);
  $("#load").addEventListener("click", loadCloud);
  calc();
})();
