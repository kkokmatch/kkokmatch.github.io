import fs from 'node:fs';

const js=fs.readFileSync('app-v6.69.js','utf8');
const fail=m=>{throw new Error(m)};
const must=(ok,m)=>{if(!ok)fail(m)};

must(js.includes("window.__kokmatchStandalone='6.69'"),'v6.69 runtime marker missing');
must(js.includes("explicitLogin71=false,loginStartToken71=''"),'explicit-login daily guard state missing');
must(js.includes("if(!explicitLogin71){forceDailyLogout71();return}"),'ordinary stale session must still expire at business-day change');
must(js.includes("if(String(T||'')===loginStartToken71)return"),'login-in-progress must defer old-day logout before fresh token exists');
must(js.includes("const submitLogin70=submitLogin"),'daily reset must wrap explicit login');
must(js.includes("explicitLogin71=true;loginStartToken71=before"),'login start token snapshot missing');
must(js.includes("finally{explicitLogin71=false;loginStartToken71=''}"),'login guard cleanup missing');
must(!js.includes("if(saved&&saved!==d){forceDailyLogout71();return}"),'old v71 double-login trigger still present');

// v6.40 stale-request protection must remain intact; v6.69 fixes a different race.
must(js.includes("reloginLatest(requestToken)"),'request-token generation protection missing');
must(js.includes('freshLoginProtected640'),'fresh-login stale-401 protection missing');
must(js.includes('Date.now()<loginGrace53'),'post-login grace protection missing');

function dayAction({saved,day,explicit,startToken,currentToken}){
  if(saved && saved!==day){
    if(!explicit)return 'logout-old-session';
    if(String(currentToken||'')===String(startToken||''))return 'defer-during-login';
    return 'accept-fresh-login';
  }
  return 'arm-current-day';
}

must(dayAction({saved:'2026-09-09',day:'2026-09-10',explicit:false,startToken:'old',currentToken:'old'})==='logout-old-session',
  'existing pre-05:00 session must still be logged out after boundary');
must(dayAction({saved:'2026-09-09',day:'2026-09-10',explicit:true,startToken:'old',currentToken:'old'})==='defer-during-login',
  'an in-flight explicit login must not be destroyed before a new token is issued');
must(dayAction({saved:'2026-09-09',day:'2026-09-10',explicit:true,startToken:'old',currentToken:'new'})==='accept-fresh-login',
  'first successful login after 05:00 must accept the newly issued token');
must(dayAction({saved:'2026-09-10',day:'2026-09-10',explicit:false,startToken:'',currentToken:'new'})==='arm-current-day',
  'normal same-day session must keep the daily timer armed');

console.log('v6.69 daily-session single-login QA passed');
