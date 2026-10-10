/* VBC Hotel Toolkit — zero dependencies, builds its own UI. All numbers are editable in Settings
   because every sim instance differs. Rules come from Martin Lui's 2014-15 guidebook. */
(() => {
const D = {wage:17,cap:95,shift:7,tw:3,base:19,exh:4,a1:40,a2:80,d1:50,thu:-20,fri:-10,sun:-20,ev:1.2,b1:40,b2:20,b3:15,biz:40};
const LB = {wage:"Front desk wage $/hr",cap:"Group capacity guideline (rooms)",shift:"Housekeeper shift (hrs)",tw:"Tidy = 1/x of an hour (x)",base:"Front desk base hrs/day",exh:"Extra desk shift (hrs)",a1:"Arrivals for +1 desk",a2:"Arrivals for +2 desk",d1:"Departures for +1 desk",thu:"Thursday price offset $",fri:"Non-event Fri offset $",sun:"Non-event Sun offset $",ev:"Event Fri price multiplier",b1:"Bid: aggressive (− $)",b2:"Bid: standard (− $)",b3:"Bid: greedy (− $)",biz:"Business-demand threshold %"};
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const num = v => { const x = parseFloat(String(v).replace(",", ".")); return isNaN(x) ? null : x; };
const usd = n => "$" + Math.round(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LS = {get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const J = (k,d) => { try { return JSON.parse(LS.get(k,"")) || d; } catch (e) { return d; } };
let S = Object.assign({}, D, J("s", {}));

const TIPS = [
["Sim speed","500x either lags or runs too fast to enter numbers. Use 100x to enter bids, 500x to let it run."],
["Save trick","Manual save resets the auto-save timer. Save, experiment, record results, then close and reopen before the next auto-save to rewind."],
["Undo a mistake","Made a big mistake? Close the sim and reopen it before it auto-saves."],
["Think like the programmer","Almost nothing is random. Hidden thresholds decide outcomes (group stays if your bid is under their secret price)."],
["Price is % based","$10 under a $100 meridian hurts far more than $10 under $250. Think in % of meridian."],
["Same start every run","The first few days always have the same groups. Great for planning and for memorizing staffing."],
["Low-demand days","Very few people come Thursdays and Sundays. Fill them with multi-night groups and lower prices."],
["Reviews","'Great deal' in reviews = you're undercharging. No hotel is perfect, don't chase 0 complaints."],
["Room Restrictions (MS#)","MS2 on a day forces transients to book that night plus the next. Set restrictions BEFORE prices and lower the price on restricted days."],
["Event Fridays","Transients only, never groups. Price 120%+ of meridian; at meridian they sell out 3 weeks early. Aim to be full only the week before."],
["Event weekend setup","MS3 on event Friday, MS2 on the Saturday after. No group sales that weekend (maybe a few Sundays). Goal: Fri/Sat/Sun equally full."],
["Group basics","Groups come as 10/20/30. Bids can't be undone, skipping a bid has no penalty, cancelled bids (no room) have no penalty. Corporate pays more than High School."],
["Bid range","$15–$40 under that day's General Room price. Bigger or longer groups want bigger discounts. Same-size groups can still differ."],
["Capacity rule","Use 95, not 105, as the cap: suites aren't sold to groups. If occupancy + group > 95 on any night of the stay, it likely won't fit."],
["Two groups, same day","Bid on the longer stay. If the worse group has the later deadline, bid both: the extra bid just cancels. If the better one has the later deadline, lower your bid to it."],
["Repeat groups","The same groups appear every run. Skip early groups that would block a big multi-night group you know is coming (e.g. 30 people x 4 nights)."],
["Copy-paste bid","Take the most common meridian −$20, copy-paste it into most bids. Go cheaper for groups you really want, pricier when many groups target one far-future day."],
["Track bids","Log every bid with Will Accept / Won't Accept prices for next run. The Bid Ledger on the Sell tab does this."],
["Front desk basics","$17/hr, min 4-hr shifts. Check-in is slower than check-out. Check-outs ~5am–2pm (peak ~10am), check-ins ~3pm–12am (peak 6–7pm). Nobody needed 12–5am."],
["Front desk rule of thumb","Baseline 1 person 5am–12am as 7/6/6 hrs. 40+ arrivals: +1 at check-in. 80+: another. 50+ departures: +1 at check-out. Extras get 4-hr shifts only."],
["Housekeeping","Full Clean ~45 min (after check-out), Tidy ~20 min (guest out for the day). Staff after peak check-out, before peak check-in (10am–6/7pm), all in one block."],
["Base + extra staffing","Set a base number for every day with Copy Forward on day one, then add/remove. Shifts set a week ahead raise Employee Satisfaction; same-day shifts anger staff."],
["Housekeeping math","n = ceil((F + T/3) / shift hrs). 7-hr shifts 10am–5pm cover ~90% of cases. Ceil trick: 100/7 → 7x14=98, so 15."],
["Housekeeping chaos","Bad schedules cause: early check-ins with no clean room, rooms untidied, bored staff (too many), rushed cleaning (too few), check-out after the shift leaves rooms dirty overnight."],
["Housekeeping feedback","'Spotless' = very good. 'Not too much, not too little' = good. 'Didn't do a good job' / 'wish I didn't rush' = could be better. 'Room is disgusting' / 'how do they expect us' = understaffed or inefficient. 'Not enough to do' = overstaffed."],
["Advertising","If business ≥40% of demand, target business; otherwise leisure. Few events (weekends empty) → add group ads. Diminishing returns: 1–2 units per option, favor pricier options."],
["Ad budget","You can exceed the budget but it likely adds nothing, so treat the budget as an effectiveness cap."],
["Safe settings","Overbooking 0%. On a guest complaint pop-up, pick option 2 (pay for a room elsewhere)."],
["Run faster","Show only the Main Lobby, close updating windows (Housekeeping/Comments), hide windows and walls. Use the browser where number typing in dropdowns works best."],
["Hotkeys","Click + Enter/Space accepts dialogs. Type a number in a dropdown to jump to it. Copy/paste bids with Ctrl/Cmd+C and Ctrl/Cmd+V (the guide's 'Ctrl+P = Paste' is a typo)."],
["Calendar","The Housekeeping window updates live but the calendar doesn't. Reopen it or hit refresh."],
["Employee satisfaction","Click a Front Desk Associate to see their satisfaction. Keep ESS and CSS at 100, then just maintain."],
["Qualifying rounds","Play to the very end even if first, teams get serious near the deadline. 'Sniping': hold your score until minutes before close. Same sim each time, so keep notes."],
["ICDC format","8 teams per session, 15 minutes, brand-new instance. Two losses and you're out, two wins and you play finals. Practice sims unlock about a month after Round 2."],
["ICDC flow","Average: 5 min setup then bids. Top 3: 3.5 min setup, assign the whole month's employees up front, 6.5 min bids, 5 min free run at 500x."],
["Winning ICDC","Start the sim immediately instead of skipping day 1: a one-week head start (especially with an event) won by a landslide."],
["ICDC logistics","Scout opponents on DECA Direct, bring a mousepad, paper notes allowed, practice with background noise, block your screen from other teams, calculate your furthest reachable day."],
["Mindset","It's a video game: business knowledge barely applies, good strategies are weird, the winner is usually the best gamer. Don't get overconfident. Have fun."]
];

// ---------- page ----------
document.title = "VBC Hotel";
[["viewport","width=device-width,initial-scale=1,viewport-fit=cover"],["apple-mobile-web-app-capable","yes"],["apple-mobile-web-app-title","VBC Hotel"]].forEach(([n,c])=>{const m=document.createElement("meta");m.name=n;m.content=c;document.head.appendChild(m)});
const st = document.createElement("style");
st.textContent = `:root{--bg:#f2f2f7;--card:#fff;--tx:#111;--mu:#6b6b76;--ac:#0a60d0;--ok:#1a8f3c;--bad:#c9341f;--ln:#e0e0e6}
@media(prefers-color-scheme:dark){:root{--bg:#000;--card:#1c1c1e;--tx:#f2f2f7;--mu:#98989f;--ac:#4d9bff;--ok:#43d067;--bad:#ff6b57;--ln:#2c2c2e}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:16px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(86px + env(safe-area-inset-bottom,0px))}
h1{font-size:20px;margin:4px 4px 10px}.c{background:var(--card);border-radius:14px;padding:14px;margin-bottom:12px}.c h2{font-size:15px;margin:0 0 10px}
.r{display:flex;gap:8px;margin-bottom:8px}.r>*{flex:1;min-width:0}input,select,textarea{width:100%;font-size:20px;padding:10px;border-radius:10px;border:1px solid var(--ln);background:var(--bg);color:var(--tx);font-family:inherit}
.big{font-size:42px;font-weight:700;color:var(--ac);line-height:1.1}.m{color:var(--mu);font-size:13px}.ok{color:var(--ok);font-weight:600}.bad{color:var(--bad);font-weight:600}
table{width:100%;border-collapse:collapse}td{padding:6px 2px;border-bottom:1px solid var(--ln)}td:nth-child(2){text-align:right;font-weight:600}td:nth-child(3){text-align:right;color:var(--mu);width:48px}
button{font-size:16px;padding:10px 12px;border-radius:10px;border:0;background:var(--ac);color:#fff;flex:1}button.g{background:var(--ln);color:var(--tx)}
.tip{border-top:1px solid var(--ln);padding:9px 0;font-size:15px}.tip b{display:block}p{margin:8px 0}
section{display:none}section.on{display:block}
nav{position:fixed;left:0;right:0;bottom:0;display:flex;background:var(--card);border-top:1px solid var(--ln);padding-bottom:env(safe-area-inset-bottom,0px)}
nav a{flex:1;text-align:center;padding:7px 0;font-size:11px;color:var(--mu)}nav a span{display:block;font-size:21px}nav a.on{color:var(--ac)}`;
document.head.appendChild(st);
const inp=(id,ph,v="")=>`<input id="${id}" inputmode="decimal" placeholder="${ph}" value="${v}" autocomplete="off">`;
const tabs=[["p0","⚡","Day"],["p1","💲","Sell"],["p2","🛠","Tools"],["p3","💡","Tips"],["p4","⚙️","Settings"]];
document.body.innerHTML = `<h1>🏨 VBC Hotel Toolkit</h1>
<section id="p0" class="on">
 <div class="c"><h2>🧹 Housekeepers</h2><div class="r">${inp("f","Full Cleans")}${inp("t","Tidies")}${inp("sh","Shift hrs",S.shift)}</div><div id="o1" class="m">Enter Full Cleans.</div></div>
 <div class="c"><h2>🛎 Front desk</h2><div class="r">${inp("a","Arrivals")}${inp("d","Departures")}</div><div id="o2" class="m">Enter arrivals / departures.</div></div>
</section>
<section id="p1">
 <div class="c"><h2>Prices by day type</h2><div class="r">${inp("m","Comp. Meridian $",LS.get("m",""))}</div><div id="o3" class="m">Enter the meridian.</div></div>
 <div class="c"><h2>Group bid</h2><div class="r">${inp("gs","Size")}${inp("go","Peak occupancy")}${inp("gn","Nights")}</div>
  <div class="r"><select id="ge"><option value="0">Not an event day</option><option value="1">Event day / weekend</option></select></div><div id="o4" class="m">Uses the meridian above.</div></div>
 <div class="c"><h2>Bid ledger (will / won't accept)</h2><div class="r"><input id="lk" placeholder="Group (e.g. 30p 4n Mon wk2)" style="font-size:16px"></div>
  <div class="r">${inp("lp","Price offered $")}<button data-act="la">✅ Accepted</button><button data-act="ln" class="g">❌ Rejected</button></div><div id="o5" class="m"></div><div class="r"><button class="g" data-act="lc">Clear ledger</button></div></div>
</section>
<section id="p2">
 <div class="c"><h2>⏱ ICDC 15:00 timer</h2><div id="tm" class="big">15:00</div><div id="tp" class="m">Tap Start when the round begins.</div><div class="r" style="margin-top:8px"><button data-act="ts">Start</button><button class="g" data-act="tr">Reset</button></div></div>
 <div class="c"><h2>⚡ Pace</h2><div class="r">${inp("pm","Minutes left")}${inp("pd","Game days / min")}</div><div id="o6" class="m"></div></div>
 <div class="c"><h2>📣 Ad target</h2><div class="r">${inp("ab","Business %")}${inp("ae","Events in month")}</div><div id="o7" class="m"></div></div>
 <div class="c"><h2>📈 Run log</h2><div class="r">${inp("rs","Score")}<input id="rn" placeholder="What did you change?" style="font-size:16px"></div><div class="r"><button data-act="ra">Add run</button><button class="g" data-act="rc">Clear</button></div><div id="o8" class="m"></div></div>
 <div class="c"><h2>📝 Notes</h2><textarea id="nt" rows="5" placeholder="Group patterns, staffing per day, strategy…">${esc(LS.get("nt",""))}</textarea></div>
</section>
<section id="p3"><div class="c"><input id="q" placeholder="🔍 Search tips (e.g. event, housekeeping, bid)" style="font-size:17px"><div id="o9"></div></div></section>
<section id="p4"><div class="c"><h2>Your sim's numbers</h2><div class="m" style="margin-bottom:8px">Everything above uses these. Change them to match your sim.</div><div id="o10"></div>
 <div class="r" style="margin-top:10px"><button data-act="sc">Copy settings</button><button class="g" data-act="sr">Reset</button></div><div id="o11" class="m"></div></div></section>
<nav>${tabs.map((t,i)=>`<a data-tab="${t[0]}" class="${i?"":"on"}"><span>${t[1]}</span>${t[2]}</a>`).join("")}</nav>`;
const v = id => num($("#" + id).value);

// ---------- calc ----------
function calc() {
  LS.set("m", $("#m").value); LS.set("nt", $("#nt").value);
  const sh = v("sh") || S.shift, F = v("f"), T = v("t") || 0, A = v("a") || 0, Dp = v("d") || 0;
  if (F === null) $("#o1").textContent = "Enter Full Cleans.";
  else {
    const hrs = F + T / S.tw, n = x => Math.ceil(hrs / x - 1e-9);
    $("#o1").innerHTML = `<div class="big">${n(sh)}</div>${hrs.toFixed(1)} work-hrs ÷ ${sh}h = ${(hrs / sh).toFixed(2)}<br>Other shifts: ${[6,8,9].map(x => x + "h→" + n(x)).join(" · ")}`;
  }
  if ($("#a").value === "" && $("#d").value === "") $("#o2").textContent = "Enter arrivals / departures.";
  else {
    const ex = []; if (A >= S.a1) ex.push("+1 check-in · ~6–7pm"); if (A >= S.a2) ex.push("+1 more check-in"); if (Dp >= S.d1) ex.push("+1 check-out · ~10am");
    const hrs = S.base + ex.length * S.exh;
    $("#o2").innerHTML = `Base: 1 person 5am–12am (7/6/6)<br>${ex.length ? ex.join("<br>") + `<br><span class="m">(${S.exh}h shifts)</span>` : "No extras needed"}<p><b style="color:var(--tx)">${hrs} hrs → ${usd(hrs * S.wage)}</b></p>`;
  }
  const m = v("m");
  if (m === null) { $("#o3").textContent = "Enter the meridian."; $("#o4").textContent = "Needs the meridian above."; }
  else {
    const R = [["Mon / Tue / Wed",m,""],["Thursday",m+S.thu,""],["Fri (no event)",m+S.fri,""],["Fri EVENT",m*S.ev,"MS3"],["Sat after event",m,"MS2"],["Saturday",m,""],["Sun after event",m,""],["Sun (no event)",m+S.sun,""]];
    $("#o3").innerHTML = "<table>" + R.map(r => `<tr><td>${r[0]}</td><td>${usd(r[1])}${r[2] === "MS3" ? "+" : ""}</td><td>${r[2]}</td></tr>`).join("") + "</table><p class='m'>Restrictions first. No groups on event weekends.</p>";
    const s = v("gs"), o = v("go"), nn = v("gn"), ev = $("#ge").value === "1";
    let h = `Per person: aggressive <b>${usd(m - S.b1)}</b> · standard <b>${usd(m - S.b2)}</b> · greedy <b>${usd(m - S.b3)}</b>`;
    if (s !== null && o !== null) { const t = s + o; h += t <= S.cap ? `<p class="ok">✅ Fits: ${t}/${S.cap}</p>` : `<p class="bad">❌ Won't fit: ${t}/${S.cap} (${t - S.cap} over)</p>`; }
    h += ev ? `<p class="bad">Event → NO bid, transients only.</p>` : nn !== null ? (nn >= 2 ? `<p class="ok">Multi-night: good for filling Thu/Sun.</p>` : `<p>1 night: only if space and no longer group competes.</p>`) : "";
    $("#o4").innerHTML = h;
  }
  const pm = v("pm"), pd = v("pd"); $("#o6").innerHTML = pm !== null && pd !== null ? `<div class="big" style="font-size:30px">Day ${(pm * pd).toFixed(1)}</div>furthest reachable` : "";
  const ab = v("ab"), ae = v("ae");
  $("#o7").innerHTML = ab === null ? "" : `<b>Target ${ab >= S.biz ? "BUSINESS" : "LEISURE"}</b> (${ab >= S.biz ? "≥" : "<"}${S.biz}% business)` + (ae !== null ? `<br>${ae <= 1 ? "Few events → also push GROUP ads." : "Many events → transients fill weekends."}` : "") + "<br>1–2 units per option, pricier first, stay in budget.";
}

// ---------- ledger / log ----------
function renderL() {
  const L = J("lg", []), g = {};
  L.forEach(e => { const o = g[e.k] = g[e.k] || {a: null, n: null}; if (e.r === "a") o.a = o.a === null ? e.p : Math.max(o.a, e.p); else o.n = o.n === null ? e.p : Math.min(o.n, e.p); });
  $("#o5").innerHTML = Object.entries(g).map(([k, o]) => {
    const s = o.a !== null && o.n !== null ? (o.n - o.a <= 1 ? o.a : Math.round((o.a + o.n) / 2)) : o.a !== null ? o.a + 5 : o.n - 5;
    return `<div class="tip"><b>${esc(k)}</b>${o.a !== null ? "✅ took " + usd(o.a) + " " : ""}${o.n !== null ? "❌ refused " + usd(o.n) : ""}<br><span class="ok">Try ${usd(s)} next run</span></div>`;
  }).join("") || "Log what groups accepted/refused to get a next-run bid.";
}
function renderLog() {
  const L = J("rl", []), best = Math.max(...L.map(e => e.s), -Infinity);
  $("#o8").innerHTML = L.slice().reverse().map(e => `<div class="tip">${e.s === best ? "🏆 " : ""}<b>${e.s}</b>${esc(e.n || "")}</div>`).join("") || "Track score + what changed each run.";
}
function renderTips() {
  const q = $("#q").value.toLowerCase().trim(), r = TIPS.filter(t => !q || (t[0] + " " + t[1]).toLowerCase().includes(q));
  $("#o9").innerHTML = `<div class="m" style="margin:8px 0">${r.length} tip${r.length === 1 ? "" : "s"}</div>` + r.map(t => `<div class="tip"><b>${t[0]}</b>${t[1]}</div>`).join("");
}
function renderSet() {
  $("#o10").innerHTML = Object.keys(D).map(k => `<div class="r" style="align-items:center"><div style="flex:2;font-size:14px">${LB[k]}</div><input data-k="${k}" inputmode="decimal" value="${S[k]}" style="flex:1"></div>`).join("");
}

// ---------- timer ----------
let T0 = null, TI = null;
const PH = [[0,210,"SETUP — sim paused (0x)","Ads, prices (Copy Forward), staff the WHOLE month"],[210,600,"BIDS — 100x ↔ 500x","Copy-paste bids, skip event-weekend groups, fix staffing"],[600,900,"FREE RUN — 500x","Spot-check staffing; sales stop once days are full"]];
const mmss = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
function tick() { const el = Math.min(900, (Date.now() - T0) / 1000), p = PH.find(x => el >= x[0] && el < x[1]) || PH[2]; $("#tm").textContent = mmss(900 - el); $("#tp").innerHTML = `<b>${p[2]}</b> · ${mmss(p[1] - el)} left in phase<br>${p[3]}`; if (el >= 900) { clearInterval(TI); $("#tp").textContent = "Time!"; } }

// ---------- events ----------
document.addEventListener("input", e => {
  const k = e.target.dataset && e.target.dataset.k;
  if (k) { const x = num(e.target.value); S[k] = x === null ? D[k] : x; LS.set("s", JSON.stringify(S)); if (k === "shift") $("#sh").value = S.shift; calc(); return; }
  if (e.target.id === "q") renderTips(); else calc();
});
document.addEventListener("click", e => {
  const a = e.target.closest("[data-tab]");
  if (a) { $$("section,nav a").forEach(x => x.classList.remove("on")); a.classList.add("on"); $("#" + a.dataset.tab).classList.add("on"); scrollTo(0, 0); return; }
  const b = e.target.closest("[data-act]"); if (!b) return; const c = b.dataset.act;
  if (c === "la" || c === "ln") { const k = $("#lk").value.trim(), p = v("lp"); if (!k || p === null) return; const L = J("lg", []); L.push({k, p, r: c === "la" ? "a" : "n"}); LS.set("lg", JSON.stringify(L)); $("#lp").value = ""; renderL(); }
  if (c === "lc") { LS.set("lg", "[]"); renderL(); }
  if (c === "ra") { const s = v("rs"); if (s === null) return; const L = J("rl", []); L.push({s, n: $("#rn").value}); LS.set("rl", JSON.stringify(L)); $("#rs").value = ""; $("#rn").value = ""; renderLog(); }
  if (c === "rc") { LS.set("rl", "[]"); renderLog(); }
  if (c === "ts") { clearInterval(TI); T0 = Date.now(); tick(); TI = setInterval(tick, 250); }
  if (c === "tr") { clearInterval(TI); $("#tm").textContent = "15:00"; $("#tp").textContent = "Tap Start when the round begins."; }
  if (c === "sr") { S = Object.assign({}, D); LS.set("s", "{}"); $("#sh").value = S.shift; renderSet(); calc(); }
  if (c === "sc") { const t = JSON.stringify(S); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => $("#o11").textContent = "Copied ✓", () => $("#o11").textContent = t); }
});
renderSet(); renderTips(); renderL(); renderLog(); calc();
})();
