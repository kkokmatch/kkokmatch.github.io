(()=>{
if(window.__kokmatchV56StateBridge)return;window.__kokmatchV56StateBridge=true;window.__kokmatchV56StateBridgePatch='1.0';
function sync56State(){
 try{window.T=typeof T!=='undefined'?String(T||''):String(window.T||'')}catch{}
 try{window.currentGroupId=typeof currentGroupId!=='undefined'?String(currentGroupId||''):String(window.currentGroupId||'')}catch{}
 try{window.me=typeof me!=='undefined'?me:window.me}catch{}
 try{window.group=typeof group!=='undefined'?group:window.group}catch{}
 try{window.currentView=typeof currentView!=='undefined'?String(currentView||'members'):String(window.currentView||'members')}catch{}
 const b=document.getElementById('groupBtn');if(b)b.classList.remove('switching52');
}
function wrapAsync56(name){
 try{const f=window[name]||eval(name);if(typeof f!=='function'||f.__v56bridge)return;const w=async function(){sync56State();try{return await f.apply(this,arguments)}finally{sync56State()}};w.__v56bridge=true;window[name]=w;try{eval(`${name}=window[name]`)}catch{}}
 catch(e){console.warn('v5.6 state bridge wrap',name,e)}
}
function wrapSync56(name){
 try{const f=window[name]||eval(name);if(typeof f!=='function'||f.__v56bridge)return;const w=function(){sync56State();try{return f.apply(this,arguments)}finally{sync56State()}};w.__v56bridge=true;window[name]=w;try{eval(`${name}=window[name]`)}catch{}}
 catch(e){console.warn('v5.6 state bridge wrap',name,e)}
}
sync56State();
['loadState','submitLogin','reloginLatest'].forEach(wrapAsync56);
['goView','renderAll','renderHeader','renderMembers','renderQueue','renderSettings','openGroupSwitch'].forEach(wrapSync56);
setInterval(sync56State,50);
})();