from pathlib import Path
import re, json

OLD='6.21'; NEW='6.22'
src=Path(f'app-v{OLD}.js').read_text()
css=Path(f'app-v{OLD}.css').read_text()

src=src.replace("window.__kokmatchStandalone='6.21';","window.__kokmatchStandalone='6.22';",1)
src=src.replace("window.__kokmatchVersionLock='6.21';","window.__kokmatchVersionLock='6.22';",1)
src=src.replace("sessionStorage.setItem('kokmatch_runtime_version','6.21')","sessionStorage.setItem('kokmatch_runtime_version','6.22')",1)

new_results="""function v615PartnerMeta(m){const y=String(m?.year||'').trim(),g=String(m?.gender||'').trim(),c=String(m?.cls||'').trim().toUpperCase();return [y?y+'년생':'출생연도 미입력',g||'성별 미입력',c?c+'급':'급수 미입력'].join(' · ')}
function v615PartnerResults(){const st=partnerEditorStateV615,root=document.getElementById('partnerOverlayV615');if(!st||!root)return;const input=root.querySelector('#v615PartnerSearch'),q=String(input?.value||'').trim().toLowerCase(),box=root.querySelector('#v615PartnerResults'),p=v615Member(st.selectedId),picked=root.querySelector('#v615PartnerPicked');if(picked)picked.innerHTML=p?'<b>선택됨</b> · '+v615Esc(p.name)+' · '+v615Esc(v615PartnerMeta(p)):'파트너 없음';if(!box)return;if(!q){box.innerHTML='<div class=\"partnerSearchHintV622\">이름을 입력하면 현재 모임 회원을 검색합니다.</div>';return}const list=(S?.members||[]).filter(x=>String(x.id)!==st.targetId&&String(x.name||'').toLowerCase().includes(q)).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko')||Number(b.year||0)-Number(a.year||0));box.innerHTML=list.map(x=>'<button type=\"button\" data-v615-action=\"partnerpick\" data-partner-id=\"'+v615Esc(x.id)+'\" class=\"v615PartnerResult '+(String(x.id)===st.selectedId?'on':'')+'\"><b>'+v615Esc(x.name)+'</b><span>'+v615Esc(v615PartnerMeta(x))+'</span></button>').join('')||'<div class=\"empty\">검색된 회원이 없습니다.</div>'}"""
src,n=re.subn(r'function v615PartnerResults\(\)\{.*?\}\nasync function v615PartnerApi',new_results+'\nasync function v615PartnerApi',src,count=1,flags=re.S)
assert n==1, 'v615PartnerResults canonical block not found'

new_open="""function openPartnerOverlayV615(id){id=String(id||'');const m=v615Member(id);if(!m)return false;if(!v615CanPartner(m)){alert('본인 또는 관리 가능한 회원의 파트너만 설정할 수 있습니다.');return false}const cur=String(m.partnerDay||'')===v615PartnerDay()?String(m.partnerId||''):'';partnerEditorStateV615={targetId:id,selectedId:cur};const root=document.createElement('div');root.id='partnerOverlayV615';root.className='partnerOverlayV615';root.innerHTML='<div class=\"partnerSheetV615\"><h3>'+v615Esc(m.name)+' · 오늘 파트너 설정</h3><div class=\"note\">현재 모임 회원의 이름을 검색한 뒤 결과를 눌러 선택하고 저장해주세요. 동명이인은 출생연도 · 성별 · 급수로 구분됩니다.</div><div class=\"field\"><label>파트너 이름 검색</label><input id=\"v615PartnerSearch\" autocomplete=\"off\" autocapitalize=\"off\" spellcheck=\"false\" placeholder=\"이름 입력\"></div><div id=\"v615PartnerResults\" class=\"partnerResultsV615\"></div><div class=\"partnerPickedV615\"><span id=\"v615PartnerPicked\">파트너 없음</span><button data-v615-action=\"partnerclear\" type=\"button\" class=\"btn ghost\">선택 해제</button></div><div class=\"acts\"><button data-v615-action=\"partnercancel\" type=\"button\" class=\"btn ghost\">취소</button><button id=\"v615PartnerSave\" data-v615-action=\"partnersave\" type=\"button\" class=\"btn pri\">저장</button></div></div>';closePartnerOverlayV615();document.getElementById('modal')?.classList.remove('on');document.body.appendChild(root);const input=root.querySelector('#v615PartnerSearch');input?.addEventListener('input',v615PartnerResults);root.addEventListener('click',ev=>{if(ev.target===root){closePartnerOverlayV615();return}const b=ev.target?.closest?.('button[data-v615-action]');if(!b||!root.contains(b))return;const action=String(b.dataset.v615Action||'');if(action==='partnerpick'){partnerEditorStateV615.selectedId=String(b.dataset.partnerId||'');const p=v615Member(partnerEditorStateV615.selectedId);if(input&&p)input.value=String(p.name||'');v615PartnerResults();return}if(action==='partnerclear'){partnerEditorStateV615.selectedId='';if(input)input.value='';v615PartnerResults();return}if(action==='partnercancel'){closePartnerOverlayV615();return}if(action==='partnersave'){savePartnerOverlayV615();return}});v615PartnerResults();setTimeout(()=>input?.focus(),30);return true}"""
src,n=re.subn(r'function openPartnerOverlayV615\(id\)\{.*?\}\nfunction installFastPartnerV6',new_open+'\nfunction installFastPartnerV6',src,count=1,flags=re.S)
assert n==1, 'openPartnerOverlayV615 canonical block not found'

# Verify poll canonical path exists before publishing.
for needle in ['window.togglePollVote22=async function','poll_toggle_vote','window.openPollCreate72=function','window.openPollEdit90=function','window.deletePoll72=','function ended22']:
    assert needle in src, f'poll canonical marker missing: {needle}'

Path(f'app-v{NEW}.js').write_text(src)
css += """

/* v6.22 canonical partner picker */
#partnerOverlayV615 .partnerResultsV615{display:grid;gap:7px;max-height:260px;overflow:auto;margin:7px 0 10px}
#partnerOverlayV615 .v615PartnerResult{width:100%;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 12px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px}
#partnerOverlayV615 .v615PartnerResult b{font-size:14px;white-space:nowrap}
#partnerOverlayV615 .v615PartnerResult span{font-size:11px;color:var(--mut);text-align:right;line-height:1.35}
#partnerOverlayV615 .v615PartnerResult.on{border-color:var(--blue);box-shadow:inset 0 0 0 1px var(--blue);background:#f4f7ff}
#partnerOverlayV615 .partnerPickedV615{display:flex;align-items:center;justify-content:space-between;gap:8px;background:#f7f9ff;border:1px solid var(--line);border-radius:12px;padding:9px 10px;min-height:48px}
#partnerOverlayV615 #v615PartnerPicked{font-size:12px;line-height:1.45}
#partnerOverlayV615 .partnerSearchHintV622{font-size:12px;color:var(--mut);padding:12px;text-align:center;background:#f7f9ff;border-radius:12px}
@media(max-width:430px){#partnerOverlayV615 .v615PartnerResult{align-items:flex-start;flex-direction:column;gap:3px}#partnerOverlayV615 .v615PartnerResult span{text-align:left}}
"""
Path(f'app-v{NEW}.css').write_text(css)

idx=Path('index.html').read_text().replace('app-v6.21.js','app-v6.22.js').replace('app-v6.21.css','app-v6.22.css').replace('data-kokmatch-version="6.21"','data-kokmatch-version="6.22"').replace("'6.21'","'6.22'")
Path('index.html').write_text(idx)
latest=json.loads(Path('latest-version.json').read_text())
latest.update({'version':62,'label':'v6.22','semanticVersion':'6.22','build':'v6.22','updatedAt':'2026-09-02T13:45:00+09:00','note':'v6.22 파트너 검색·동명이인 선택 저장 안정화 · 운동투표 canonical 검수'})
Path('latest-version.json').write_text(json.dumps(latest,ensure_ascii=False,indent=2)+'\n')

qa=Path('scripts/qa-current-runtime.mjs').read_text()
qa=qa.replace("  {id:'spec1',name:'관람회원',year:1992,gender:'남',age:'30',cls:'E',type:'member',role:'member',totalGames:0,state:'spectator',joinedAt:Date.now()-60000}\n];", "  {id:'spec1',name:'관람회원',year:1992,gender:'남',age:'30',cls:'E',type:'member',role:'member',totalGames:0,state:'spectator',joinedAt:Date.now()-60000},\n  {id:'same1',name:'김민수',year:1990,gender:'남',age:'30',cls:'B',type:'member',role:'member',totalGames:0,state:'out',joinedAt:null},\n  {id:'same2',name:'김민수',year:1992,gender:'여',age:'30',cls:'C',type:'member',role:'member',totalGames:0,state:'out',joinedAt:null}\n];")
marker="  const uniqueAssets=[...new Set(appAssets)];"
addition="""  await page.evaluate(()=>window.openPartner66?.('mgr'));
  await page.waitForSelector('#partnerOverlayV615 #v615PartnerSearch');
  await page.fill('#v615PartnerSearch','김민수');
  const partnerRows=await page.locator('#v615PartnerResults .v615PartnerResult').allTextContents();
  if(partnerRows.length!==2||!partnerRows.some(x=>x.includes('1990년생')&&x.includes('남')&&x.includes('B급'))||!partnerRows.some(x=>x.includes('1992년생')&&x.includes('여')&&x.includes('C급')))throw new Error('partner duplicate-name results are not distinguishable: '+JSON.stringify(partnerRows));
  await page.locator('#v615PartnerResults .v615PartnerResult').filter({hasText:'1992년생'}).click();
  const picked=await page.locator('#v615PartnerPicked').textContent();
  if(!picked?.includes('김민수')||!picked.includes('1992년생'))throw new Error('partner selection did not react: '+picked);
  await page.locator('#partnerOverlayV615 [data-v615-action=\"partnercancel\"]').click();

"""
assert marker in qa, 'qa insertion marker missing'
qa=qa.replace(marker,addition+marker,1)
Path('scripts/qa-current-runtime.mjs').write_text(qa)
