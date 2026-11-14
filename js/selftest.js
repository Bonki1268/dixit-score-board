"use strict";
/* 驗收案例自測：在主控台執行 selfTest() */
function selfTest(){
  const cases = [
    {n:5, v:{A:"S",B:"A",C:"S",D:"B"}, exp:{S:2,A:2,B:1,C:1,D:0}},
    {n:3, v:{A:"B",B:"A"}, exp:{S:0,A:1,B:1}},
    {n:3, v:{A:"S",B:"S"}, exp:{S:0,A:1,B:1}},
    {n:7, v:{A:"S",B:"C",C:"D",D:"C",E:"C",F:"C"}, exp:{S:1,A:1,B:0,C:3,D:1,E:0,F:0}},
  ];
  return cases.map(c => {
    const ids = Object.keys(c.exp);
    const r = score(ids, "S", c.v, modeOf(ids.length));
    return ids.every(id => gainTotal(r.gains[id]) === c.exp[id]);
  });
}
