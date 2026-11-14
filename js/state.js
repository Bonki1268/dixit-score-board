"use strict";
const KEY = "dixit-scoreboard-v1";
const MIN_P = 3, MAX_P = 12;

let S = load();

function fresh(){
  return {players:[], target:30, storyteller:null, votes:{}, history:[], names:{}, nextId:1};
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ const d = JSON.parse(raw); if(d && Array.isArray(d.players)) return Object.assign(fresh(), d); }
  }catch(e){}
  return fresh();
}
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){}
}
function commit(){ save(); render(); }

