"use strict";
/* ---------- 操作 ---------- */
function addPlayer(name){
  name = name.trim();
  if(!name) return;
  if(S.players.length >= MAX_P){ toast("最多 " + MAX_P + " 人"); return; }
  const id = "p" + (S.nextId++);
  S.players.push({id, name});
  S.names[id] = name;
  if(S.storyteller == null) S.storyteller = id;
  commit();
}
function renamePlayer(id, name){
  name = name.trim();
  const p = S.players.find(p => p.id === id);
  if(!p || !name) return;
  p.name = name; S.names[id] = name; save();
}
function removePlayer(id){
  const p = S.players.find(p => p.id === id);
  if(!p) return;
  if(!confirm("刪除「" + p.name + "」？已結算的分數紀錄仍會保留在紀錄表。")) return;
  const idx = S.players.indexOf(p);
  S.players.splice(idx, 1);
  delete S.votes[id];
  for(const v in S.votes) if(S.votes[v] === id) delete S.votes[v];
  if(S.storyteller === id) S.storyteller = S.players.length ? S.players[idx % S.players.length].id : null;
  commit();
}
function movePlayer(id, dir){
  const i = S.players.findIndex(p => p.id === id), j = i + dir;
  if(j < 0 || j >= S.players.length) return;
  [S.players[i], S.players[j]] = [S.players[j], S.players[i]];
  commit();
}
function setStoryteller(id){
  S.storyteller = id;
  delete S.votes[id];
  commit();
}
function setVote(voter, target){
  if(S.votes[voter] === target) delete S.votes[voter]; else S.votes[voter] = target;
  commit();
}
function setTarget(v){
  v = parseInt(v, 10);
  if(v > 0){ S.target = v; commit(); }
}

let lastResult = null;
function settle(){
  const ids = S.players.map(p => p.id);
  if(ids.length < MIN_P){ toast("至少需要 " + MIN_P + " 位玩家"); return; }
  const missing = ids.filter(id => id !== S.storyteller && S.votes[id] == null);
  if(missing.length) return; // UI 已列出未投的人
  const mode = modeOf(ids.length);
  const r = score(ids, S.storyteller, S.votes, mode);
  const delta = {};
  ids.forEach(id => delta[id] = gainTotal(r.gains[id]));
  S.history.push({
    n: S.history.length + 1, storyteller: S.storyteller, votes: Object.assign({}, S.votes),
    mode: mode.key, level: r.level, guessed: r.guessed, notGuessed: r.notGuessed,
    gains: r.gains, delta, ids
  });
  lastResult = S.history[S.history.length - 1];
  // 下一位說書人
  const i = ids.indexOf(S.storyteller);
  S.storyteller = ids[(i + 1) % ids.length];
  S.votes = {};
  commit();
  window.scrollTo({top:0, behavior:"smooth"});
}
function undo(){
  const r = S.history.pop();
  if(!r) return;
  S.storyteller = S.players.some(p => p.id === r.storyteller) ? r.storyteller : (S.players[0] && S.players[0].id);
  S.votes = {};
  for(const v in r.votes){
    if(S.players.some(p => p.id === v) && S.players.some(p => p.id === r.votes[v])) S.votes[v] = r.votes[v];
  }
  lastResult = null;
  commit();
}
function resetAll(){
  if(!confirm("全部重來？保留玩家名單，清空分數與紀錄。")) return;
  S.history = []; S.votes = {}; lastResult = null;
  S.storyteller = S.players[0] ? S.players[0].id : null;
  commit();
}

/* ---------- 匯出 ---------- */
function exportTSV(){
  const seen = [];
  S.history.forEach(r => r.ids.forEach(id => { if(!seen.includes(id)) seen.push(id); }));
  S.players.forEach(p => { if(!seen.includes(p.id)) seen.push(p.id); });
  const nm = id => S.names[id] || id;
  const lines = [];
  lines.push(["回合","說書人","結果"].concat(seen.map(nm)).join("\t"));
  const run = {};
  S.history.forEach(r => {
    seen.forEach(id => run[id] = (run[id]||0) + (r.delta[id]||0));
    lines.push([r.n, nm(r.storyteller), levelText(r)].concat(seen.map(id => r.ids.includes(id) ? run[id] : "")).join("\t"));
  });
  lines.push(["總分","",""].concat(seen.map(id => run[id]||0)).join("\t"));
  const text = lines.join("\n");
  const done = () => toast("已複製，可直接貼進 Excel");
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try{ document.execCommand("copy"); done(); }catch(e){ toast("複製失敗，請手動複製"); }
  ta.remove();
}

