import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const GLOBAL='__global__',enc=new TextEncoder();
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const ok=(x:any,s=200)=>Response.json(x,{status:s,headers:cors}); const err=(m:string,s=400,extra:any={})=>ok({error:m,...extra},s);
async function sha(v:string){const b=await crypto.subtle.digest('SHA-256',enc.encode(String(v)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function roleOf(m:any){const r=String(m?.role||'member');return r==='admin'?'admin':r==='manager'?'manager':r==='organizer'?'organizer':'member'}
function roleLabel(r:string,temp=false){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':temp?'임시편성자':'일반'}
function pairKey(a:string,b:string){return a<b?a+'|'+b:b+'|'+a}
async function session(req:Request){const raw=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;const {data}=await db.from('kokmatch_sessions').select('club_id,role,member_id,display_name,expires_at').eq('token_hash',await sha(raw)).gt('expires_at',new Date().toISOString()).maybeSingle();return data||null}
async function state(gid:string){const {data,error}=await db.from('kokmatch_state').select('data').eq('club_id',gid).maybeSingle();if(error)throw error;return data?.data||{}}
function repeatPairs(s:any,players:string[],threshold=3){const M=(id:string)=>(s.members||[]).find((m:any)=>String(m.id)===String(id)),rows:any[]=[];for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const count=Math.max(0,Number(s.pairCounts?.[pairKey(players[i],players[j])])||0);if(count>=threshold)rows.push({a:players[i],b:players[j],aName:M(players[i])?.name||'-',bName:M(players[j])?.name||'-',count})}return rows.sort((a,b)=>b.count-a.count)}

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return err('Not found',404);
 try{
  const u=await session(req);if(!u)return err('로그인이 필요합니다.',401);const b=await req.json().catch(()=>({}));
  const global=u.role==='admin'&&u.club_id===GLOBAL;const gid=global?String(b.groupId||'').trim():String(u.club_id||'').trim();
  if(!gid)return err('모임을 선택해주세요.',409);if(!global&&b.groupId&&String(b.groupId)!==gid)return err('다른 모임은 관리할 수 없습니다.',403);
  const s=await state(gid),actor=(s.members||[]).find((m:any)=>String(m.id)===String(u.member_id||''));
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
  if(action==='add_to_pending'&&b.forceRepeat!==true){const p=(s.pendingGames||[]).find((x:any)=>String(x.id)===String(b.pendingId||''));const next=[...(p?.players||[]),String(b.memberId||'')];if(next.length===4){const rows=repeatPairs(s,next);if(rows.length)return err('3회 이상 같이 경기한 조합이 있습니다.',409,{warning:'repeat_pair',repeatPairs:rows})}}
  if(action==='move_pending_member'&&b.forceRepeat!==true){const p=(s.pendingGames||[]).find((x:any)=>String(x.id)===String(b.targetPendingId||''));const next=[...(p?.players||[]),String(b.memberId||'')];if(next.length===4){const rows=repeatPairs(s,next);if(rows.length)return err('3회 이상 같이 경기한 조합이 있습니다.',409,{warning:'repeat_pair',repeatPairs:rows})}}
  const {data,error}=await db.rpc('kokmatch_atomic_game_action',{p_gid:gid,p_action:action,p_body:body});
  if(error){const msg=String(error.message||'처리에 실패했습니다.').replace(/^.*?: /,'');return err(msg,409)}
  return ok({success:true,data});
 }catch(e){console.error(e);return err(e instanceof Error?e.message:'원자 처리 중 오류가 발생했습니다.',500)}
});
