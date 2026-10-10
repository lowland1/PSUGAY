// VBC Hotel Quick Calc — for the free "Scriptable" app (iOS). One file, no Xcode, no signing.
// Formulas from Martin Lui's VBC Hotel Management guidebook (2014-15 sim).

// ---- OPTIONAL: Firestore (REST). Leave blank to skip. Rules must allow reads. ----
const CONFIG = { projectId: "", apiKey: "", collection: "groups" };
// -----------------------------------------------------------------------------------

const WAGE = 17;
const num = s => { const x = parseFloat(String(s).replace(",", ".")); return isNaN(x) ? null : x; };
const usd = n => "$" + Math.round(n);

const store = {
  get(k, d) { try { return Keychain.contains(k) ? Keychain.get(k) : d; } catch (e) { return d; } },
  set(k, v) { try { Keychain.set(k, String(v)); } catch (e) {} }
};

async function form(title, msg, fields, buttons) {
  const a = new Alert();
  a.title = title;
  if (msg) a.message = msg;
  for (const f of fields) {
    const tf = a.addTextField(f.label, f.value || "");
    if (tf && tf.setDecimalPadKeyboard) tf.setDecimalPadKeyboard();
  }
  buttons.forEach(b => a.addAction(b));
  a.addCancelAction("Done");
  const i = await a.presentAlert();
  return { i, vals: fields.map((_, j) => a.textFieldValue(j)) };
}

async function show(title, text) {
  const a = new Alert();
  a.title = title;
  a.message = text;
  a.addAction("OK");
  await a.presentAlert();
}

// ---------- Day calc: housekeepers + front desk in one shot ----------
async function dayCalc(vals) {
  const F = num(vals[0]), T = num(vals[1]) || 0, A = num(vals[2]) || 0, D = num(vals[3]) || 0;
  const shift = num(store.get("shift", "7")) || 7;
  const lines = [];

  if (F !== null) {
    const hrs = F + T / 3;
    const n = Math.ceil(hrs / shift - 1e-9);
    lines.push(`🧹 HOUSEKEEPERS: ${n}`);
    lines.push(`   (${hrs.toFixed(1)} work-hrs ÷ ${shift}-hr shifts = ${(hrs / shift).toFixed(2)})`);
  }

  if (vals[2] !== "" || vals[3] !== "") {
    const extras = [];
    if (A >= 40) extras.push("+1 check-in, 4h around 6–7pm (5–9pm)");
    if (A >= 80) extras.push("+1 more check-in, 4h (3 total)");
    if (D >= 50) extras.push("+1 check-out, 4h around 10am (8am–12pm)");
    const hours = 19 + extras.length * 4;
    lines.push("");
    lines.push("🛎 FRONT DESK");
    lines.push("   Base: 1 person 5am–12am (5–12, 12–6, 6–12)");
    extras.forEach(e => lines.push("   " + e));
    if (!extras.length) lines.push("   No extras needed");
    lines.push(`   ${hours} hrs → ${usd(hours * WAGE)}`);
  }

  if (!lines.length) lines.push("Enter at least Full Cleans or Arrivals/Departures.");
  await show("Day Result", lines.join("\n"));
}

// ---------- Prices + group bids ----------
async function pricesBids() {
  const { i, vals } = await form(
    "💲 Prices & Bids",
    "Meridian · Group size · Peak occupancy",
    [
      { label: "Comp. Meridian $", value: store.get("meridian", "") },
      { label: "Group size" },
      { label: "Peak occupancy in stay" }
    ],
    ["Go"]
  );
  if (i !== 0) return;
  const m = num(vals[0]);
  if (m === null) return show("Oops", "Need the meridian.");
  store.set("meridian", m);

  const L = [];
  L.push("PRICES (restrictions first!)");
  L.push(`Mon/Tue/Wed   ${usd(m)}`);
  L.push(`Thursday      ${usd(m - 20)}`);
  L.push(`Fri (no event) ${usd(m - 10)}`);
  L.push(`Fri EVENT     ${usd(m * 1.2)}+  MS3`);
  L.push(`Sat after evt ${usd(m)}  MS2`);
  L.push(`Saturday      ${usd(m)}`);
  L.push(`Sun after evt ${usd(m)}`);
  L.push(`Sun (no evt)  ${usd(m - 20)}`);
  L.push("");
  L.push("GROUP BID / person");
  L.push(`Aggressive ${usd(m - 40)} · Standard ${usd(m - 20)} · Greedy ${usd(m - 15)}`);

  const s = num(vals[1]), o = num(vals[2]);
  if (s !== null && o !== null) {
    const tot = s + o;
    L.push("");
    L.push(tot <= 95 ? `✅ Fits: ${tot}/95` : `❌ Won't fit: ${tot}/95 (${tot - 95} over)`);
  }
  L.push("");
  L.push("No bids on event weekends.");
  await show("Prices & Bids", L.join("\n"));
}

// ---------- More ----------
async function pace() {
  const { i, vals } = await form("⚡ ICDC Pace", "Minutes left · Game days per minute",
    [{ label: "Minutes remaining" }, { label: "Days / min" }], ["Go"]);
  if (i !== 0) return;
  const m = num(vals[0]), d = num(vals[1]);
  if (m === null || d === null) return;
  await show("Pace", `Furthest reachable: Day ${(m * d).toFixed(1)}\nStart the sim immediately — a week head start won ICDC.`);
}

async function ads() {
  const { i, vals } = await form("📣 Ad Target", "Business % of demand · Events in month",
    [{ label: "Business %" }, { label: "Events" }], ["Go"]);
  if (i !== 0) return;
  const b = num(vals[0]), e = num(vals[1]);
  if (b === null) return;
  let t = `Target ${b >= 40 ? "BUSINESS" : "LEISURE"} (${b >= 40 ? "≥" : "<"}40% business)`;
  if (e !== null) t += e <= 1 ? "\nFew events → also push GROUP ads." : "\nMany events → transients fill weekends.";
  t += "\n1–2 units per option, favor pricier ones, stay under budget.";
  await show("Advertising", t);
}

async function setShift() {
  const { i, vals } = await form("Shift length", "Housekeeper shift hours (default 7)",
    [{ label: "Hours", value: store.get("shift", "7") }], ["Save"]);
  if (i === 0 && num(vals[0])) store.set("shift", num(vals[0]));
}

function fv(v) {
  const k = ["stringValue", "integerValue", "doubleValue", "booleanValue", "timestampValue"].find(x => x in v);
  return k ? v[k] : JSON.stringify(v);
}

async function cloud() {
  if (!CONFIG.projectId || !CONFIG.apiKey)
    return show("☁️ Cloud", "Fill in projectId and apiKey in CONFIG at the top of the script.");
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.projectId}/databases/(default)/documents/${CONFIG.collection}?pageSize=100&key=${CONFIG.apiKey}`;
    const j = await new Request(url).loadJSON();
    if (j.error) return show("☁️ Error", j.error.message);
    const docs = j.documents || [];
    const rows = docs.map(d => {
      const id = d.name.split("/").pop();
      const f = Object.entries(d.fields || {}).map(([k, v]) => `<b>${k}</b>: ${fv(v)}`).join("<br>");
      return `<div class="c"><h3>${id}</h3>${f}</div>`;
    }).join("") || "<p>No documents.</p>";
    const html = `<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{font:16px -apple-system;padding:12px;background:#f2f2f7;color:#111}
.c{background:#fff;border-radius:12px;padding:12px;margin-bottom:10px}h3{margin:0 0 6px}
@media(prefers-color-scheme:dark){body{background:#000;color:#eee}.c{background:#1c1c1e}}</style>
<h2>${CONFIG.collection} (${docs.length})</h2>${rows}`;
    await WebView.loadHTML(html);
  } catch (e) {
    await show("☁️ Error", String(e));
  }
}

async function more() {
  const s = new Alert();
  s.title = "More";
  ["⚡ ICDC Pace", "📣 Ad Target", "☁️ Cloud (Firestore)", "⚙️ Shift length"].forEach(x => s.addAction(x));
  s.addCancelAction("Back");
  const i = await s.presentSheet();
  if (i === 0) await pace();
  else if (i === 1) await ads();
  else if (i === 2) await cloud();
  else if (i === 3) await setShift();
}

// ---------- Main loop: opens straight to the Day Calc ----------
while (true) {
  const { i, vals } = await form(
    "🏨 Day Calc",
    "Full Cleans · Tidies · Arrivals · Departures",
    [{ label: "Full Cleans" }, { label: "Tidies" }, { label: "Arrivals" }, { label: "Departures" }],
    ["Calc", "Prices & Bids", "More"]
  );
  if (i === -1) break;
  if (i === 0) await dayCalc(vals);
  else if (i === 1) await pricesBids();
  else await more();
}
Script.complete();
