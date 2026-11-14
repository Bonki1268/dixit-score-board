"use strict";
/* ---------- 事件 ---------- */
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if(!b) return;
  if(b.dataset.vote) setVote(b.dataset.vote, b.dataset.target);
  else if(b.dataset.story) setStoryteller(b.dataset.story);
  else if(b.dataset.move) movePlayer(b.dataset.move, +b.dataset.dir);
  else if(b.dataset.del) removePlayer(b.dataset.del);
  else if(b.id === "settle") settle();
  else if(b.id === "undo") undo();
  else if(b.id === "export") exportTSV();
  else if(b.id === "reset") resetAll();
});
document.addEventListener("submit", e => {
  if(e.target.id === "addForm"){
    e.preventDefault();
    const inp = document.getElementById("newName");
    addPlayer(inp.value);
    const again = document.getElementById("newName"); if(again) { again.value = ""; again.focus(); }
  }
});
document.addEventListener("change", e => {
  if(e.target.dataset.rename){ renamePlayer(e.target.dataset.rename, e.target.value); render(); }
  else if(e.target.id === "target") setTarget(e.target.value);
});

render();
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  // 單一檔案頁面，載入後本身即可離線運作；不需額外快取
}

