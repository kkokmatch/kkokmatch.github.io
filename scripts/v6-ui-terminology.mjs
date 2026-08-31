import fs from 'node:fs';
const file='app-v6.0.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes("window.__kokmatchStandalone='6.0'"))throw new Error('Not a v6 standalone runtime');
const terms=[['총관리자','개발자'],['모임관리자','모임장'],['게임편성자','운영진'],['일반회원','일반']];
for(const [from,to] of terms)src=src.replaceAll(from,to);
fs.writeFileSync(file,src);
console.log('Canonical v6 role terminology applied: 개발자 / 모임장 / 운영진 / 일반');
