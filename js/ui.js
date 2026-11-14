"use strict";
/* ---------- 畫面 ---------- */
const ICON = {
  trophy:'<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>',
  crown:'<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z"/></svg>',
  up:'<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down:'<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  x:'<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  check:'<svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>'
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nameOf = id => esc(S.names[id] || "?");
function levelText(r){
  return r.level === "all" ? "全部猜中" : r.level === "none" ? "全部沒猜中" : "部分猜中（" + r.guessed + " 人猜中）";
}
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2000);
}

function render(){
  const app = document.getElementById("app");
  // 保留輸入焦點的值
  const n = S.players.length;
  const mode = modeOf(n);
  const tot = totals();
  const maxScore = Math.max(S.target, ...S.players.map(p => tot[p.id] || 0));
  let html = "";

  // 獲勝
  const top = Math.max(0, ...S.players.map(p => tot[p.id] || 0));
  if(S.history.length && top >= S.target){
    const winners = S.players.filter(p => (tot[p.id]||0) === top).map(p => esc(p.name));
    html += `<div class="win" role="status">${ICON.trophy}<span>${winners.join("、")} ${winners.length > 1 ? "並列獲勝" : "獲勝"}（${top} 分）</span></div>`;
  }

  // 上一回合結果
  if(lastResult && S.history[S.history.length-1] === lastResult){
    const r = lastResult;
    html += `<section><h2>第 ${r.n} 回合結果</h2>
      <div class="muted">說書人 ${nameOf(r.storyteller)}・${levelText(r)}</div><ul class="res">`;
    r.ids.forEach(id => {
      const g = r.gains[id], parts = [];
      if(g.story) parts.push("說書人 +" + g.story);
      if(g.guess) parts.push("猜中 +1");
      if(g.decoy) parts.push("混淆卡 " + g.decoyRaw + " 票 +" + g.decoy + (g.decoyRaw > g.decoy ? "（上限）" : ""));
      html += `<li><b>${nameOf(id)}</b> <span class="plus">+${r.delta[id]}</span>
        <div class="src">${parts.length ? parts.join("　") : "本回合沒有得分"}</div></li>`;
    });
    html += `</ul></section>`;
  }

  // 玩家
  html += `<section><h2>玩家（${n}／${MAX_P}）</h2>
    <ul class="players">`;
  S.players.forEach((p, i) => {
    html += `<li>
      <input value="${esc(p.name)}" data-rename="${p.id}" maxlength="12" aria-label="玩家 ${i+1} 名稱">
      <button class="sm" data-move="${p.id}" data-dir="-1" ${i===0?"disabled":""} aria-label="上移 ${esc(p.name)}">${ICON.up}</button>
      <button class="sm" data-move="${p.id}" data-dir="1" ${i===n-1?"disabled":""} aria-label="下移 ${esc(p.name)}">${ICON.down}</button>
      <button class="sm danger" data-del="${p.id}" aria-label="刪除 ${esc(p.name)}">${ICON.x}</button></li>`;
  });
  html += `</ul>
    <form class="row" id="addForm"><input class="grow" id="newName" aria-label="新玩家名字" placeholder="輸入玩家名字" maxlength="12" ${n>=MAX_P?"disabled":""}>
      <button class="primary" ${n>=MAX_P?"disabled":""}>加入</button></form>
    <div class="muted" style="margin-top:8px">請依座位順時針排序；說書人會依名單順序輪替。至少 ${MIN_P} 人。</div>
    <div class="row" style="margin-top:10px"><label for="target">目標分數</label>
      <input id="target" type="number" inputmode="numeric" min="1" value="${S.target}" style="width:90px"></div>
  </section>`;

  if(n >= MIN_P){
    html += `<section><div class="mode"><b>${mode.name}</b><br>${mode.tip}</div>`;

    // 投票
    const st = S.storyteller;
    html += `<h2 style="margin-top:14px">第 ${S.history.length + 1} 回合・說書人：${nameOf(st)}</h2>
      <div class="row wrap" style="margin-bottom:6px"><span class="muted">更換說書人：</span>`;
    S.players.forEach(p => {
      html += `<button class="sm chip ${p.id===st?"on":""}" data-story="${p.id}" aria-pressed="${p.id===st}">${p.id===st?ICON.check+" ":""}${esc(p.name)}</button>`;
    });
    html += `</div><div class="muted" style="margin-bottom:6px">每位閒家點選「投給誰」（不含自己）</div>`;
    const missing = [];
    S.players.forEach(p => {
      if(p.id === st) return;
      if(S.votes[p.id] == null) missing.push(esc(p.name));
      html += `<div class="vote"><div class="who">${esc(p.name)} 投給</div><div class="chips">`;
      S.players.forEach(q => {
        if(q.id === p.id) return;
        const on = S.votes[p.id] === q.id;
        html += `<button class="chip ${on?"on":""} ${q.id===st?"st":""}" data-vote="${p.id}" data-target="${q.id}" aria-pressed="${on}">${on?ICON.check+" ":""}${esc(q.name)}${q.id===st?"（說書人）":""}</button>`;
      });
      html += `</div></div>`;
    });
    if(missing.length) html += `<div class="alert" role="status">還沒投票：${missing.join("、")}</div>`;
    html += `<button class="primary" id="settle" style="width:100%;margin-top:6px" ${missing.length?"disabled":""}>計算本回合</button>
      <div class="row" style="margin-top:8px">
        <button class="grow" id="undo" ${S.history.length?"":"disabled"}>復原上一回合</button>
      </div></section>`;
  } else {
    html += `<section><div class="alert">再加入 ${MIN_P - n} 位玩家就能開始（最少 ${MIN_P} 人）。</div></section>`;
  }

  // 計分榜
  if(n){
    html += `<section><h2>計分榜（目標 ${S.target} 分）</h2>`;
    const sorted = S.players.slice().sort((a,b) => (tot[b.id]||0) - (tot[a.id]||0));
    sorted.forEach(p => {
      const sc = tot[p.id]||0, lead = S.history.length && sc === top && top > 0;
      html += `<div class="bar ${lead?"lead":""}"><div class="top"><span>${lead?ICON.crown+" ":""}${esc(p.name)}${p.id===S.storyteller?'<span class="tag">說書人</span>':""}</span><b>${sc}</b></div>
        <div class="track"><div class="fill" style="width:${Math.min(100, sc/maxScore*100)}%"></div></div></div>`;
    });
    html += `</section>`;
  }

  // 紀錄
  html += `<section><h2>回合紀錄</h2>`;
  if(!S.history.length) html += `<div class="muted">還沒有紀錄。</div>`;
  else {
    const seen = [];
    S.history.forEach(r => r.ids.forEach(id => { if(!seen.includes(id)) seen.push(id); }));
    S.players.forEach(p => { if(!seen.includes(p.id)) seen.push(p.id); });
    html += `<div class="tablewrap"><table><tr><th>回合</th><th>說書人</th><th>結果</th>${seen.map(id => `<th>${nameOf(id)}</th>`).join("")}</tr>`;
    const run = {};
    S.history.forEach(r => {
      seen.forEach(id => run[id] = (run[id]||0) + (r.delta[id]||0));
      html += `<tr><td>${r.n}</td><td>${nameOf(r.storyteller)}</td><td>${levelText(r)}</td>${seen.map(id => `<td>${r.ids.includes(id) ? run[id] + (r.delta[id] ? ` <span class="plus">+${r.delta[id]}</span>` : "") : "–"}</td>`).join("")}</tr>`;
    });
    html += `<tr class="total"><td colspan="3">總分</td>${seen.map(id => `<td>${run[id]||0}</td>`).join("")}</tr></table></div>`;
  }
  html += `<div class="row wrap" style="margin-top:10px">
      <button class="primary grow" id="export" ${S.history.length?"":"disabled"}>複製成 Excel 表格</button>
      <button class="danger" id="reset" ${S.history.length?"":"disabled"}>全部重來</button></div></section>`;

  const active = document.activeElement;
  let sel = null;
  if(active && active !== document.body){
    if(active.id) sel = "#" + active.id;
    else for(const k of ["vote","story","move","del","rename"]) if(active.dataset && active.dataset[k]){
      sel = "[data-" + k + '="' + active.dataset[k] + '"]' + (active.dataset.target ? '[data-target="' + active.dataset.target + '"]' : "") + (active.dataset.dir ? '[data-dir="' + active.dataset.dir + '"]' : "");
      break;
    }
  }
  app.innerHTML = html;
  if(sel){ const el = app.querySelector(sel); if(el && !el.disabled) el.focus({preventScroll:true}); }
}

