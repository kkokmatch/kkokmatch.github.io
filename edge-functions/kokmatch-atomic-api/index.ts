import {repeatPairs687} from "./repeat.mjs";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";
const sql=postgres(Deno.env.get("SUPABASE_DB_URL")!,{prepare:false,max:3,idle_timeout:10,connect_timeout:5});
const GLOBAL='__global__',enc=new TextEncoder();
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const ok=(x:any,s=200)=>Response.json(x,{status:s,headers:cors}); const err=(m:string,s=400,extra:any={})=>ok({error:m,...extra},s);
async function sha(v:string){const b=await crypto.subtle.digest('SHA-256',enc.encode(String(v)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function roleOf(m:any){const r=String(m?.role||'member');return r==='admin'?'admin':r==='manager'?'manager':r==='organizer'?'organizer':'member'}
function roleLabel(r:string,temp=false){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':temp?'임시편성자':'일반'}
function pairKey(a:string,b:string){return a<b?a+'|'+b:b+'|'+a}
async function session(req:Request){const raw=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;const rows=await sql`select club_id,role,member_id,display_name,expires_at from public.kokmatch_sessions where token_hash=${await sha(raw)} and expires_at>now() limit 1`;return rows[0]||null}

async function state(gid:string){return (await sql`select data from public.kokmatch_state where club_id=${gid} limit 1`)[0]?.data||{}}

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return err('Not found',404);
 try{
  const u=await session(req);if(!u)return err('로그인이 필요합니다.',401);const b=await req.json().catch(()=>({}));
  const global=u.role==='admin'&&u.club_id===GLOBAL;const gid=global?String(b.groupId||'').trim():String(u.club_id||'').trim();
  if(!gid)return err('모임을 선택해주세요.',409);if(!global&&b.groupId&&String(b.groupId)!==gid)return err('다른 모임은 관리할 수 없습니다.',403);
  return await sql.begin(async tx=>{
  const s=(await tx`select data from public.kokmatch_state where club_id=${gid} for update`)[0]?.data||{},actor=(s.members||[]).find((m:any)=>String(m.id)===String(u.member_id||''));
  if(!global&&!actor)return err('현재 회원정보를 찾을 수 없습니다.',403);if(!global&&roleOf(actor)!==String(u.role))return err('권한이 변경되었습니다. 다시 로그인해주세요.',403);
  const temp=!!actor&&actor.type!=='guest'&&roleOf(actor)==='member'&&actor.state!=='out'&&String(actor.tempOrganizerDay||'')===today();
  const game=global||u.role==='manager'||u.role==='organizer'||temp;
  const action=String(b.action||''),own=action==='set_my_attendance';
  const core=['set_member_attendance','create_pending','remove_from_pending','cancel_pending','begin_game','finish_game','set_game_court','set_courts','add_to_pending','move_pending_member'];
  if(!own&&!core.includes(action))return err('지원하지 않는 작업입니다.',404);
  const memberCanFinish=action==='finish_game'&&!!actor&&actor.type!=='guest';if(!own&&!game&&!memberCanFinish)return err('게임편성 권한이 필요합니다.',403);

  const autoOn=s?.autoGame?.enabled===true;
  const autoCreate=action==='create_pending'&&String(b.createdByMode||'')==='auto';
  const manualFormation=['create_pending','remove_from_pending','cancel_pending','add_to_pending','move_pending_member'].includes(action)&&!autoCreate;
  if(autoOn&&manualFormation)return err('자동게임편성 작동 중입니다. 자동기능을 유지하거나 끈 뒤 직접 편성해주세요.',409,{warning:'auto_game_active',autoGameActive:true});
  if(autoCreate&&!autoOn)return err('자동게임편성이 해제되어 자동 편성을 중단했습니다.',409,{warning:'auto_game_disabled',autoGameActive:false});

  const courtCount=Math.max(0,Number(s?.courtCount)||0);if(action==='begin_game'||action==='set_game_court'){const court=Number(b.court);if(!Number.isInteger(court)||court<1||court>courtCount)return err('사용 중인 코트 범위를 벗어났습니다.',409)}
  let body={...b};if(own){body.memberId=String(u.member_id||'');body.id=String(u.member_id||'')}
  if(action==='create_pending')body={...body,createdByMemberId:String(u.member_id||actor?.id||''),createdByName:String(u.display_name||actor?.name||'').trim(),createdByRole:roleLabel(String(u.role||''),temp),createdByMode:autoCreate?'auto':'manual',autoEnabledByName:String(b.autoEnabledByName||''),autoEnabledByRole:String(b.autoEnabledByRole||'')};
  if(action==='add_to_pending'&&b.forceRepeat!==true){const p=(s.pendingGames||[]).find((x:any)=>String(x.id)===String(b.pendingId||''));const next=[...(p?.players||[]),String(b.memberId||'')];if(next.length>=2){const rows=repeatPairs687(s,next,String(p?.id||''));if(rows.length)return err('3회 이상 같이 경기한 조합이 있습니다.',409,{warning:'repeat_pair',repeatPairs:rows})}}
  if(action==='move_pending_member'&&b.forceRepeat!==true){const p=(s.pendingGames||[]).find((x:any)=>String(x.id)===String(b.targetPendingId||''));const next=[...(p?.players||[]),String(b.memberId||'')];if(next.length>=2){const rows=repeatPairs687(s,next,String(p?.id||''));if(rows.length)return err('3회 이상 같이 경기한 조합이 있습니다.',409,{warning:'repeat_pair',repeatPairs:rows})}}
  if(action==='create_pending'&&b.forceRepeat!==true){const rows=repeatPairs687(s,b.players||[]);if(rows.length)return err('반복 편성을 확인해주세요.',409,{warning:'repeat_pair',repeatPairs:rows})}
  let data;
  try{data=(await tx`select public.kokmatch_atomic_game_action(${gid},${action},${tx.json(body)}) as data`)[0].data}
  catch(e){return err('편성 상태가 변경되었거나 처리할 수 없는 요청입니다. 새로고침 후 다시 시도해주세요.',409)}
  return ok({success:true,data});
  });
 }catch(e){console.error(e);return err(e instanceof Error?e.message:'원자 처리 중 오류가 발생했습니다.',500)}
});
