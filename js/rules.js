"use strict";
/* ---------- 規則 ---------- */
function modeOf(n){
  if(n <= 3) return {key:3, name:"3 人模式", hand:7, play:2, refill:2, cap:Infinity,
    tip:"每人 7 張手牌，閒家每人出 2 張，回合結束每人補 2 張"};
  if(n <= 6) return {key:6, name:"4–6 人模式（標準）", hand:6, play:1, refill:1, cap:Infinity,
    tip:"每人 6 張手牌，閒家每人出 1 張，回合結束每人補 1 張"};
  return {key:7, name:"7 人以上模式", hand:6, play:1, refill:1, cap:3,
    tip:"每人 6 張手牌，閒家每人出 1 張，回合結束每人補 1 張；混淆卡加分最多 +3。迪士尼版只有 6 個投票盤，請用手勢比號碼或拆桌"};
}

// votes: {voterId: targetId}; 回傳 {level, guessed, notGuessed, gains:{id:{guess,decoy,decoyRaw,story}}}
function score(playerIds, storyId, votes, mode){
  const gains = {};
  playerIds.forEach(id => gains[id] = {guess:0, decoy:0, decoyRaw:0, story:0});
  const guessers = playerIds.filter(id => id !== storyId);
  let guessed = 0;
  guessers.forEach(v => {
    const t = votes[v];
    if(t === storyId){ gains[v].guess = 1; guessed++; }
    else if(t != null && gains[t]) gains[t].decoyRaw++;
  });
  const notGuessed = guessers.length - guessed;
  playerIds.forEach(id => { gains[id].decoy = Math.min(gains[id].decoyRaw, mode.cap); });
  let level = "partial";
  if(guessed === guessers.length) level = "all";
  else if(guessed === 0) level = "none";
  gains[storyId].story = level === "partial" ? Math.min(guessed, notGuessed) : 0;
  return {level, guessed, notGuessed, gains};
}
function gainTotal(g){ return g.guess + g.decoy + g.story; }

function totals(){
  const t = {};
  S.history.forEach(r => { for(const id in r.delta) t[id] = (t[id]||0) + r.delta[id]; });
  return t;
}

