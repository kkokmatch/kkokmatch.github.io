import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GLOBAL="__global__",enc=new TextEncoder();
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Cache-Control":"no-store"};
const ok=(x:any,s=200)=>Response.json(x,{status:s,headers:cors});
const err=(m:string,s=400)=>ok({error:m},s);
async function sha(v:string){const b=await crypto.subtle.digest("SHA-256",enc.encode(String(v)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
function today(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function yearKst(){return Number(new Intl.DateTimeFormat("en",{timeZone:"Asia/Seoul",year:"numeric"}).format(new Date()))}
function ageBand(year:number){const age=Math.max(1,yearKst()-year+1);return String(Math.max(10,Math.min(90,Math.floor(age/10)*10)))}
function roleOf(m:any){const r=String(m?.role||"member");return r==="admin"?"admin":r==="manager"?"manager":r==="organizer"?"organizer":"member"}
function normalize(s:any){s=s&&typeof s==="object"?s:{};const cc=Math.max(1,Math.min(16,Number(s.courtCount)||8));const names=Array.isArray(s.courtNames)?s.courtNames:[];return{...s,courtCount:cc,courtNames:Array.from({length:cc},(_,i)=>String(names[i]||`${i+1}코트`)),members:Array.isArray(s.members)?s.members:[],queue:Array.isArray(s.queue)?s.queue:[],pendingGames:Array.isArray(s.pendingGames)?s.pendingGames:[],games:Array.isArray(s.games)?s.games:[],history:Array.isArray(s.history)?s.history:[],pairCounts:s.pairCounts&&typeof s.pairCounts==="object"&&!Array.isArray(s.pairCounts)?s.pairCounts:{}}}
async function session(req:Request){const raw=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");if(!raw)return null;const {data}=await db.from("kokmatch_sessions").select("club_id,role,member_id,display_name,expires_at").eq("token_hash",await sha(raw)).gt("expires_at",new Date().toISOString()).maybeSingle();return data||null}
async function getState(gid:string){const {data,error}=await db.from("kokmatch_state").select("data").eq("club_id",gid).maybeSingle();if(error)throw error;return normalize(data?.data||{})}
async function saveState(gid:string,s:any){const data=normalize(s);const {error}=await db.from("kokmatch_state").upsert({club_id:gid,data,updated_at:new Date().toISOString()},{onConflict:"club_id"});if(error)throw error;return data}
async function scope(u:any,b:any){const global=u.role==="admin"&&u.club_id===GLOBAL;const gid=global?String(b.groupId||"").trim():String(u.club_id||"").trim();if(!gid)return{error:err("모임을 선택해주세요.")};if(!global&&b.groupId&&String(b.groupId)!==gid)return{error:err("다른 모임은 관리할 수 없습니다.",403)};const {data:g}=await db.from("kokmatch_groups").select("group_id,name,is_active").eq("group_id",gid).maybeSingle();if(!g?.is_active)return{error:err("운영중인 모임을 찾을 수 없습니다.",404)};const s=await getState(gid),actorMember=s.members.find((m:any)=>String(m.id)===String(u.member_id||""));if(!global){if(!actorMember)return{error:err("현재 회원정보를 찾을 수 없습니다.",403)};if(roleOf(actorMember)!==String(u.role))return{error:err("권한이 변경되었습니다. 다시 로그인해주세요.",403)}}const temp=!!actorMember&&actorMember.type!=="guest"&&roleOf(actorMember)==="member"&&actorMember.state!=="out"&&String(actorMember.tempOrganizerDay||"")===today();return{global,gid,g,s,actorMember,temp,actorRole:global?"admin":String(u.role)}}
async function rolePin(gid:string,id:string,role:string,pin:string,oldRole:string){if(role==="member"){await db.from("kokmatch_member_auth").delete().eq("club_id",gid).eq("member_id",id);return null}if(pin){if(!/^\d{4,8}$/.test(pin))return"역할 PIN은 숫자 4~8자리로 입력해주세요.";await db.from("kokmatch_member_auth").upsert({club_id:gid,member_id:id,pin_hash:await sha(pin),updated_at:new Date().toISOString()},{onConflict:"club_id,member_id"});return null}if(oldRole!==role)return"새 역할에 사용할 PIN을 숫자 4~8자리로 입력해주세요.";const {data}=await db.from("kokmatch_member_auth").select("member_id").eq("club_id",gid).eq("member_id",id).maybeSingle();return data?null:"해당 역할에 사용할 PIN을 입력해주세요."}
async function verifyRolePin(u:any,gid:string,pin:string){if(u.role==="admin"&&u.club_id===GLOBAL){const {data}=await db.from("kokmatch_global_admins").select("pin_hash").eq("display_name",u.display_name).maybeSingle();return !!data?.pin_hash&&data.pin_hash===await sha(pin)}const {data}=await db.from("kokmatch_member_auth").select("pin_hash").eq("club_id",gid).eq("member_id",u.member_id).maybeSingle();return !!data?.pin_hash&&data.pin_hash===await sha(pin)}
function pair(s:any,ps:string[]){s.pairCounts=s.pairCounts||{};for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const k=[ps[i],ps[j]].sort().join("|");s.pairCounts[k]=(Number(s.pairCounts[k])||0)+1}}

Deno.serve(async(req:Request)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return err("Not found",404);try{
 const b=await req.json().catch(()=>({}));const op=String(b.op||"action");
 // Older clients share the canonical attendance endpoint and its session/role checks.
 if(op==="action"&&["set_my_attendance","set_member_attendance"].includes(String(b.action||""))){
  try{return await fetch(Deno.env.get("SUPABASE_URL")+"/functions/v1/kokmatch-atomic-api",{method:"POST",headers:{"content-type":"application/json","authorization":req.headers.get("authorization")||""},body:JSON.stringify(b),signal:AbortSignal.timeout(10000)})}
  catch(e){console.error("attendance upstream unavailable",e);return err("입장 상태를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",503)}
 }
 const u=await session(req);if(!u)return err("로그인이 필요합니다.",401);const sc:any=await scope(u,b);if(sc.error)return sc.error;const {global,gid,g}=sc;let s=sc.s;const actorRole=sc.actorRole,actor=sc.actorMember,temp=sc.temp,M=(id:string)=>s.members.find((m:any)=>String(m.id)===String(id));const game=global||actorRole==="manager"||actorRole==="organizer"||temp;const memberInfo=global||actorRole==="manager"||actorRole==="organizer";

 if(op==="member_save"){
  if(!memberInfo)return err("회원정보 관리 권한이 없습니다.",403);const id=String(b.memberId||"").trim(),add=!id,old=add?null:M(id);if(!add&&!old)return err("회원을 찾을 수 없습니다.",404);if(!add&&roleOf(old)==="admin"&&!global)return err("총관리자 정보는 수정할 수 없습니다.",403);
  const name=String(b.name||"").trim(),year=Number(b.year),gender=b.gender==="여"?"여":"남",cls=String(b.cls||"C").toUpperCase();if(!name)return err("이름을 입력해주세요.");if(!Number.isInteger(year)||year<1900||year>yearKst())return err("출생연도를 확인해주세요.");if(!["A","B","C","D","E"].includes(cls))return err("급수는 A~E로 선택해주세요.");let type=b.type==="guest"?"guest":"member",newRole=String(b.role||"member");const oldRole=old?roleOf(old):"member";let targetId=id;
  if(!add&&oldRole==="admin"){
   type="member";newRole="admin";
  }else{
   if(type==="guest")newRole="member";
   if(actorRole==="organizer"&&!global)newRole=add?"member":oldRole;
   if((global||actorRole==="manager")&&!["member","organizer","manager"].includes(newRole))return err("해당 역할을 지정할 수 없습니다.",403);
  }
  let inviter=type==="guest"?String(b.inviter||"").trim().slice(0,40):"";if(type==="guest"&&!inviter)return err("게스트의 초대인을 입력해주세요.");
  if(type!=="guest"&&s.members.some((m:any)=>String(m.id)!==id&&m.type!=="guest"&&String(m.name||"").trim()===name&&Number(m.year)===year&&(m.gender==="여"?"여":"남")===gender))return err("같은 모임에 이름·출생연도·성별이 모두 같은 회원이 이미 있습니다.",409);
  if(add){const nid="m"+crypto.randomUUID().replaceAll("-","").slice(0,12);targetId=nid;if(newRole!=="member"){const pe=await rolePin(gid,nid,newRole,String(b.pin||"").trim(),"member");if(pe)return err(pe)}s.members.push({id:nid,name,year,gender,age:ageBand(year),cls,type,role:newRole,inviter,totalGames:0,state:"out",joinedAt:null})}
  else{const pin=String(b.pin||"").trim();if((global||actorRole==="manager")&&newRole!=="admin"&&(newRole!==oldRole||!!pin)){const pe=await rolePin(gid,id,newRole,pin,oldRole);if(pe)return err(pe)}old.name=oldRole==="admin"?old.name:name;old.year=year;old.gender=gender;old.age=ageBand(year);old.cls=cls;old.type=type;old.role=newRole;old.inviter=inviter;if(type==="guest"||newRole!=="member")delete old.tempOrganizerDay;if(oldRole!==newRole)await db.from("kokmatch_sessions").delete().eq("club_id",gid).eq("member_id",id)}
  const saved=await saveState(gid,s),savedMember=saved.members.find((m:any)=>String(m.id)===String(targetId));if(b.compact===true)return ok({success:true,member:savedMember,group:{groupId:gid,name:g.name}});return ok({success:true,data:saved,group:{groupId:gid,name:g.name}})
 }

 if(op==="member_delete"){
  if(!memberInfo)return err("회원삭제 권한이 없습니다.",403);const id=String(b.memberId||""),m=M(id);if(!m)return err("회원을 찾을 수 없습니다.",404);if(roleOf(m)==="admin")return err("총관리자는 삭제할 수 없습니다.",403);if(m.state==="playing"||m.state==="matched"||s.games.some((x:any)=>x.players?.includes(id))||s.pendingGames.some((x:any)=>x.players?.includes(id)))return err("편성대기 또는 게임중인 회원은 삭제할 수 없습니다.",409);s.queue=s.queue.filter((x:any)=>String(x)!==id);s.members=s.members.filter((x:any)=>String(x.id)!==id);for(const k of Object.keys(s.pairCounts||{}))if(k.split("|").includes(id))delete s.pairCounts[k];await db.from("kokmatch_member_auth").delete().eq("club_id",gid).eq("member_id",id);await db.from("kokmatch_sessions").delete().eq("club_id",gid).eq("member_id",id);return ok({success:true,data:await saveState(gid,s),group:{groupId:gid,name:g.name}})
 }

 if(op==="reset_roster"){
  if(!global&&actorRole!=="manager")return err("모임관리자 이상 권한이 필요합니다.",403);const pin=String(b.pin||"").trim();if(!pin)return err("현재 역할 PIN을 입력해주세요.");if(!(await verifyRolePin(u,gid,pin)))return err(global?"총관리자 PIN이 올바르지 않습니다.":"모임관리자 PIN이 올바르지 않습니다.",403);const keep=new Set<string>();for(const m of s.members)if(roleOf(m)==="admin"||roleOf(m)==="manager")keep.add(String(m.id));const removed=s.members.filter((m:any)=>!keep.has(String(m.id))),kept=s.members.filter((m:any)=>keep.has(String(m.id))).map((m:any)=>{const x={...m,totalGames:0,state:"out",joinedAt:null};delete x.tempOrganizerDay;return x});s={...s,members:kept,queue:[],pendingGames:[],games:[],history:[],pairCounts:{},dayKey:today()};const ids=removed.map((m:any)=>String(m.id));if(ids.length)await db.from("kokmatch_member_auth").delete().eq("club_id",gid).in("member_id",ids);await db.from("kokmatch_sessions").delete().eq("club_id",gid);return ok({success:true,data:await saveState(gid,s),removedCount:removed.length,group:{groupId:gid,name:g.name}})
 }

 if(op!=="action")return err("지원하지 않는 작업입니다.",404);const a=String(b.action||"");
 if(a==="set_temp"){
  if(!global&&!["manager","organizer"].includes(actorRole))return err("임시편성자 지정 권한이 없습니다.",403);const m=M(String(b.memberId||""));if(!m)return err("회원을 찾을 수 없습니다.",404);if(m.type==="guest"||roleOf(m)!=="member")return err("일반회원만 임시편성자로 지정할 수 있습니다.",409);if(b.enabled===true&&m.state==="out")return err("오늘 참석 중인 일반회원만 임시편성자로 지정할 수 있습니다.",409);if(b.enabled===true)m.tempOrganizerDay=today();else delete m.tempOrganizerDay;return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="create_pending"){
  if(!game)return err("게임편성 권한이 필요합니다.",403);const ps=[...new Set((b.players||[]).map(String))] as string[];if(!ps.length||ps.length>4)return err("1명부터 4명까지 선택해주세요.");s.pendingGames.push({id:"p"+crypto.randomUUID().replaceAll("-","").slice(0,12),players:ps,createdAt:Date.now()});s.queue=s.queue.filter((x:string)=>!ps.includes(String(x)));ps.forEach(id=>{const m=M(id);if(m)m.state="matched"});return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="remove_from_pending"){
  if(!game)return err("게임편성 권한이 필요합니다.",403);const p=s.pendingGames.find((x:any)=>x.id===b.pendingId),mid=String(b.memberId||"");if(!p)return err("대기조를 찾을 수 없습니다.",404);p.players=p.players.filter((x:string)=>String(x)!==mid);if(!p.players.length)s.pendingGames=s.pendingGames.filter((x:any)=>x.id!==p.id);const m=M(mid);if(m){m.state="waiting";if(!m.joinedAt)m.joinedAt=Date.now()}if(!s.queue.includes(mid))s.queue.push(mid);return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="add_to_pending"){
  if(!game)return err("게임편성 권한이 필요합니다.",403);const p=s.pendingGames.find((x:any)=>x.id===b.pendingId),mid=String(b.memberId||"");if(!p||p.players.length>=4)return err("빈자리가 없습니다.",409);if(!p.players.includes(mid))p.players.push(mid);s.queue=s.queue.filter((x:string)=>String(x)!==mid);const m=M(mid);if(m)m.state="matched";return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="move_pending_order"){
  if(!game)return err("게임편성 권한이 필요합니다.",403);const i=s.pendingGames.findIndex((x:any)=>x.id===b.pendingId),j=b.direction==="up"?i-1:i+1;if(i<0||j<0||j>=s.pendingGames.length)return err("더 이상 이동할 수 없습니다.",409);[s.pendingGames[i],s.pendingGames[j]]=[s.pendingGames[j],s.pendingGames[i]];return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="cancel_pending"){
  if(!game)return err("게임편성 권한이 필요합니다.",403);const p=s.pendingGames.find((x:any)=>x.id===b.pendingId);if(!p)return err("대기조를 찾을 수 없습니다.",404);s.pendingGames=s.pendingGames.filter((x:any)=>x.id!==p.id);for(const mid of p.players){const m=M(mid);if(m){m.state="waiting";if(!m.joinedAt)m.joinedAt=Date.now()}if(!s.queue.includes(mid))s.queue.push(mid)}return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="begin_game"){
  if(!game)return err("게임편성 권한이 필요합니다.",403);const p=s.pendingGames.find((x:any)=>x.id===b.pendingId),court=Number(b.court);if(!p||p.players.length!==4)return err("4명 편성이 완료되어야 합니다.",409);if(s.games.some((x:any)=>Number(x.court)===court))return err("이미 사용중인 코트입니다.",409);s.pendingGames=s.pendingGames.filter((x:any)=>x.id!==p.id);s.games.push({id:"g"+crypto.randomUUID().replaceAll("-","").slice(0,12),court,players:p.players,matchedAt:p.createdAt,startedAt:Date.now()});p.players.forEach((id:string)=>{const m=M(id);if(m)m.state="playing"});return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="finish_game"){
  const canFinish=global||!!actor&&actor.type!=="guest";if(!canFinish)return err("게스트는 경기를 종료할 수 없습니다.",403);const gg=s.games.find((x:any)=>x.id===b.gameId);if(!gg)return err("경기를 찾을 수 없습니다.",404);s.games=s.games.filter((x:any)=>x.id!==gg.id);s.history.push({...gg,endedAt:Date.now()});pair(s,gg.players);for(const mid of gg.players){const m=M(mid);if(m){m.totalGames=(Number(m.totalGames)||0)+1;m.state="waiting";m.joinedAt=Date.now()}if(!s.queue.includes(mid))s.queue.push(mid)}return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="set_game_court"){
  if(!game)return err("코트변경 권한이 없습니다.",403);const gg=s.games.find((x:any)=>x.id===b.gameId);if(!gg)return err("경기를 찾을 수 없습니다.",404);gg.court=Number(b.court);return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="set_courts"){
  if(!game)return err("코트설정 권한이 없습니다.",403);const n=Number(b.count);if(n<1||n>16)return err("코트 수는 1~16입니다.");s.courtCount=n;s.courtNames=Array.from({length:n},(_,i)=>String(s.courtNames?.[i]||`${i+1}코트`));return ok({success:true,data:await saveState(gid,s)})
 }
 if(a==="set_court_name"){
  if(!game)return err("코트설정 권한이 없습니다.",403);const n=Number(b.court);if(n<1||n>s.courtCount)return err("코트 번호를 확인해주세요.");s.courtNames[n-1]=String(b.name||"").trim()||`${n}코트`;return ok({success:true,data:await saveState(gid,s)})
 }
 return err("지원하지 않는 작업입니다.",404)
 }catch(e){console.error(e);return err(e instanceof Error?e.message:"v60 처리 중 오류가 발생했습니다.",500)}});

