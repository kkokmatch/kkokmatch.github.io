import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";

const sql=postgres(Deno.env.get("SUPABASE_DB_URL")!,{prepare:false,max:3,idle_timeout:10,connect_timeout:5});
const GLOBAL="__global__",DUMMY_PREFIX="dummy_202608_test_",enc=new TextEncoder();
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET, OPTIONS","Cache-Control":"no-store"};
const out=(x:any,s=200)=>Response.json(x,{status:s,headers:cors});
const err=(m:string,s=400)=>out({error:m},s);
async function sha(v:string){const b=await crypto.subtle.digest("SHA-256",enc.encode(String(v)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function session(req:Request){const raw=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;const rows=await sql`select club_id,role,member_id,display_name,expires_at from public.kokmatch_sessions where token_hash=${await sha(raw)} and expires_at>now() limit 1`;return rows[0]||null}

function businessDay(ts=Date.now()){const shifted=new Date(ts-5*60*60*1000);return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(shifted)}
function validDate(v:string){return /^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T00:00:00Z"))}
function validMonth(v:string){return /^\d{4}-\d{2}$/.test(v)&&Number(v.slice(5,7))>=1&&Number(v.slice(5,7))<=12}
function monthEnd(mon:string){const [y,m]=mon.split("-").map(Number);return `${y}-${String(m).padStart(2,"0")}-${String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,"0")}`}
function daysBetween(a:string,b:string){return Math.floor((Date.parse(b+"T00:00:00Z")-Date.parse(a+"T00:00:00Z"))/86400000)}
function isDummy(r:any){return String(r?.game_id||r?.gameId||"").startsWith(DUMMY_PREFIX)}
function gameRow(r:any){return {gameId:String(r.game_id||""),businessDay:String(r.business_day||""),startedAt:Number(r.started_at)||0,endedAt:r.ended_at==null?null:Number(r.ended_at),matchedAt:r.matched_at==null?null:Number(r.matched_at),durationMin:Number(r.duration_min)||0,court:r.court==null?null:Number(r.court),courtName:String(r.court_name||""),players:Array.isArray(r.players)?r.players:[],playerNames:Array.isArray(r.player_names)?r.player_names:[],waitMsByPlayer:r.wait_ms_by_player&&typeof r.wait_ms_by_player==='object'?r.wait_ms_by_player:{},autoEnded:!!r.auto_ended}}

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="GET")return err("Not found",404);
 try{
  const u=await session(req);if(!u)return err("로그인이 필요합니다.",401);
  const url=new URL(req.url),global=u.role==="admin"&&u.club_id===GLOBAL;
  const requested=String(url.searchParams.get("groupId")||"").trim();
  const gid=global?requested:String(u.club_id||"");
  if(!gid||gid===GLOBAL)return err("조회할 모임을 선택해주세요.",409);
  if(!global&&requested&&requested!==gid)return err("다른 모임의 통계는 조회할 수 없습니다.",403);
  const today=businessDay();
  const from=String(url.searchParams.get("from")||today),to=String(url.searchParams.get("to")||today),month=String(url.searchParams.get("month")||today.slice(0,7));
  if(!validDate(from)||!validDate(to)||from>to)return err("조회 기간을 확인해주세요.");
  if(daysBetween(from,to)>370)return err("조회 기간은 최대 371일까지 선택할 수 있습니다.");
  if(!validMonth(month))return err("조회 월을 확인해주세요.");
  const stateRow=(await sql`select data from public.kokmatch_state where club_id=${gid} limit 1`)[0];if(!stateRow)return err("모임 정보를 찾을 수 없습니다.",404);
  const state=stateRow.data&&typeof stateRow.data==='object'?stateRow.data:{};
  const members=Array.isArray(state.members)?state.members:[];
  let selfId=String(u.member_id||"");
  if(global){const linked=members.find((m:any)=>String(m.id||"")===selfId)||members.find((m:any)=>String(m.name||"").trim()===String(u.display_name||"").trim());selfId=String(linked?.id||selfId||"")}
  const archive=async(a:string,b:string)=>await sql`select game_id,business_day::text,started_at,ended_at,matched_at,duration_min,court,court_name,players,player_names,wait_ms_by_player,auto_ended from public.kokmatch_game_archive where club_id=${gid} and ended_at is not null and business_day>=${a}::date and business_day<=${b}::date order by started_at asc`;
  const rangeQ={data:await archive(from,to)};
  const first=`${month}-01`,last=monthEnd(month);
  const monthRows=from===first&&to===last?rangeQ.data:await archive(first,last);
  const rawRange:any[]=rangeQ.data||[];
  const visibleRange=global?rawRange:rawRange.filter((r:any)=>!isDummy(r));
  const visibleMonth=global?monthRows:monthRows.filter((r:any)=>!isDummy(r));
  const monthGames=visibleMonth.map(gameRow),dummyMonth=global?monthGames.filter((g:any)=>isDummy(g)):[];
  const dummyDays=new Map<string,Set<string>>();for(const g of dummyMonth){for(const id0 of g.players||[]){const id=String(id0||'');if(!id)continue;let s=dummyDays.get(id);if(!s){s=new Set<string>();dummyDays.set(id,s)}s.add(String(g.businessDay||''))}}
  const bq={data:await sql`select member_id,game_count,attendance_count,captured_at from public.kokmatch_month_baseline where club_id=${gid} and month=${month}`};
  const baselines=(bq.data||[]).map((b:any)=>{const memberId=String(b.member_id||""),capturedAtMs=Date.parse(String(b.captured_at||""))||0;const dummyBefore=global?dummyMonth.filter((g:any)=>(g.players||[]).map(String).includes(memberId)&&Number(g.endedAt||0)<=capturedAtMs).length:0;return{memberId,gameCount:(Number(b.game_count)||0)+dummyBefore,attendanceCount:(Number(b.attendance_count)||0)+(global?(dummyDays.get(memberId)?.size||0):0),capturedAtMs}});
  const safeMembers=members.filter((m:any)=>String(m?.type||"member")!=="guest").map((m:any)=>{const id=String(m?.id||""),attendanceMonth=String(m?.attendanceMonth||""),baseCount=Number(m?.attendanceCount)||0,hist=m?.attendanceHistory&&typeof m.attendanceHistory==='object'?{...m.attendanceHistory}:{};const extra=global?(dummyDays.get(id)?.size||0):0;if(extra){const current=Number(hist[month]);const fallback=attendanceMonth===month?baseCount:0;hist[month]=(Number.isFinite(current)?current:fallback)+extra}return{id,name:String(m?.name||""),age:String(m?.age||""),year:String(m?.year||""),cls:String(m?.cls||""),gender:String(m?.gender||""),role:String(m?.role||"member"),type:String(m?.type||"member"),attendanceMonth,attendanceCount:attendanceMonth===month?baseCount+extra:baseCount,attendanceHistory:hist,waitDay:String(m?.waitDay||""),waitTotalMs:Number(m?.waitTotalMs)||0,totalGames:Number(m?.totalGames)||0,memberSince:String(m?.memberSince||"")}});
  return out({success:true,groupId:gid,today,from,to,month,selfMemberId:selfId,members:safeMembers,rangeGames:visibleRange.map(gameRow),monthGames,baselines,dummyGameCount:global?dummyMonth.length:0,dummyExpiresAt:global&&dummyMonth.length?"2026-08-28T05:00:00+09:00":null});
 }catch(e){console.error(e);return err("통계 조회 중 오류가 발생했습니다.",500)}
});
