import fs from 'node:fs';
import cp from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
let js=read('app-v6.25.js');

const startToken='async function saveMemberEditorV618(ev){';
const endToken='function openMemberEditorV618(m){';
const fast=`async function saveMemberEditorV618(ev){
 ev?.preventDefault?.();ev?.stopPropagation?.();const st=memberEditorStateV618,root=document.getElementById('memberEditorV615');if(!st||!root)return false;
 const name=String(root.querySelector('#v618Name')?.value||'').trim(),year=Number(root.querySelector('#v618Year')?.value||0),gender=String(root.querySelector('#v618Gender')?.value||'남'),cls=String(root.querySelector('#v618Cls')?.value||'C'),type=String(root.querySelector('#v618Type')?.value||st.type||'member');let role=String(root.querySelector('#v618Role')?.value||st.role||'member');if(type==='guest')role='member';const pin=String(root.querySelector('#v618Pin')?.value||'').trim(),inviter=type==='guest'?String(root.querySelector('#v618Inviter')?.value||'').trim():'';
 editorErrorV618('');if(!name){editorErrorV618('이름을 입력해주세요.');return false}if(!Number.isInteger(year)||year<1900||year>new Date().getFullYear()){editorErrorV618('출생연도를 확인해주세요.');return false}if(pin&&!/^\\d{4,8}$/.test(pin)){editorErrorV618('PIN/비밀번호는 숫자 4~8자리로 입력해주세요.');return false}if(type==='guest'&&!inviter){editorErrorV618('게스트의 초대인을 입력해주세요.');return false}
 const b=root.querySelector('#v618Save');if(b){b.disabled=true;b.textContent='저장 중...'}
 try{const x=await v620MemberApi('member_save',{memberId:st.memberId||'',name,year,gender,cls,type,role,pin,inviter,compact:true});if(x?.data){S=x.data;window.S=x.data;try{normalizeClient()}catch{}}else if(x?.member){const i=(S?.members||[]).findIndex(m=>String(m.id)===String(x.member.id));if(i>=0)S.members[i]=x.member;else S.members.push(x.member);window.S=S;try{normalizeClient()}catch{}}closeMemberEditorV618();renderHeader();if(role!==st.role||String(st.memberId||'')===String(me?.memberId||''))renderNav();renderMembers();requestAnimationFrame(()=>{try{window.__kokmatchFinalizeRoster22?.()}catch{}});return true}catch(e){editorErrorV618(e?.message||String(e||'회원정보 저장에 실패했습니다.'));return false}finally{if(b?.isConnected){b.disabled=false;b.textContent=st.memberId?'저장':'등록'}}
}
`;

let out='',pos=0,replaced=0;
while(true){
 const a=js.indexOf(startToken,pos);
 if(a<0){out+=js.slice(pos);break}
 const b=js.indexOf(endToken,a+startToken.length);
 if(b<0)throw new Error('member editor end token missing after save definition '+(replaced+1));
 out+=js.slice(pos,a)+fast;
 pos=b;
 replaced++;
}
js=out;
if(replaced!==2)throw new Error(`expected 2 duplicated member save definitions, found ${replaced}`);

js=js.replaceAll("window.__kokmatchStandalone='6.25'","window.__kokmatchStandalone='6.26'")
     .replaceAll("window.__kokmatchVersionLock='6.25'","window.__kokmatchVersionLock='6.26'")
     .replaceAll("sessionStorage.setItem('kokmatch_runtime_version','6.25')","sessionStorage.setItem('kokmatch_runtime_version','6.26')");

const saveBlocks=[...js.matchAll(/async function saveMemberEditorV618\(ev\)\{[\s\S]*?(?=function openMemberEditorV618\(m\)\{)/g)].map(m=>m[0]);
if(saveBlocks.length!==2)throw new Error('post-patch member save definition count '+saveBlocks.length);
for(const [i,s] of saveBlocks.entries()){
 if(!s.includes('compact:true'))throw new Error(`save definition ${i+1} is not compact`);
 if(s.includes("v615MemberApi('member_save'"))throw new Error(`legacy save helper remains in definition ${i+1}`);
 if(s.includes('standardizeRosterV618()'))throw new Error(`duplicate heavy roster standardizer remains in save definition ${i+1}`);
}

write('app-v6.26.js',js);
write('app-v6.26.css',read('app-v6.25.css').replaceAll('v6.25','v6.26'));
let index=read('index.html');
index=index.replaceAll('app-v6.25.css?v=6.25','app-v6.26.css?v=6.26')
           .replaceAll('app-v6.25.js?v=6.25','app-v6.26.js?v=6.26')
           .replaceAll('6.25','6.26').replaceAll('v625','v626');
write('index.html',index);
const latest=JSON.parse(read('latest-version.json'));
latest.version=66;latest.label='v6.26';latest.semanticVersion='6.26';latest.build='v6.26';latest.updatedAt='2026-09-02T16:35:00+09:00';latest.note='v6.26 중복 회원저장 경로 통합 · compact 응답 활성화 · 전체상태 재수신 제거 · 저장속도 추가 안정화';
write('latest-version.json',JSON.stringify(latest,null,2)+'\n');

cp.execFileSync('node',['--check','app-v6.26.js'],{stdio:'inherit'});
cp.execFileSync('node',['scripts/validate-standalone-runtime.mjs'],{stdio:'inherit'});
console.log(JSON.stringify({patchedSaveDefinitions:replaced,allCompact:true},null,2));
