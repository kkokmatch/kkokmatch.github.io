import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { bestFour } from "./scoring.mjs";

const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const GLOBAL='__global__',enc=new TextEncoder();
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const ok=(x:any,s=200)=>Response.json(x,{status:s,headers:cors});
const err=(m:string,s=400,extra:any={})=>ok({error:m,...extra},s);

async function sha(v:string){const b=await crypto.subtle.digest('SHA-256',enc.encode(String(v)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function session(req:Request){const raw=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!raw)return null;const {data}=await db.from('kokmatch_sessions').select('club_id,role,member_id,display_name,expires_at').eq('token_hash',await sha(raw)).gt('expires_at',new Date().toISOString()).maybeSingle();return data||null}
function roleOf(m:any){const r=String(m?.role||'member');return r==='admin'?'admin':r==='manager'?'manager':r==='organizer'?'organizer':'member'}
function roleLabel(r:string){return r==='admin'?'개발자':r==='manager'?'모임장':r==='organizer'?'운영진':'일반'}
function cfgOf(s:any){const c=s?.autoGame||{};return {enabled:c.enabled===true,mode:'priority_v673',updatedAt:Number(c.updatedAt)||0,updatedBy:c.updatedBy&&typeof c.updatedBy==='object'?c.updatedBy:{}}}
async function loadRow(gid:string){const {data,error}=await db.from('kokmatch_state').select('data,revision').eq('club_id',gid).maybeSingle();if(error)throw error;return data}
function validateMemberSession(u:any,s:any,global:boolean){if(global)return true;const a=(s?.members||[]).find((m:any)=>String(m.id)===String(u.member_id||''));return !!a&&roleOf(a)===String(u.role||'')}
function validateStaff(u:any,s:any,global:boolean){return validateMemberSession(u,s,global)&&(global||u.role==='manager'||u.role==='organizer')}

async function writeConfig(gid:string,u:any,global:boolean,enabled:boolean){
 for(let i=0;i<4;i++){
  const row=await loadRow(gid);if(!row)throw new Error('모임 상태를 찾을 수 없습니다.');const s:any=row.data||{};
  if(!validateStaff(u,s,global))throw new Error('개발자·모임장·운영진만 자동게임편성을 설정할 수 있습니다.');
  const role=global?'admin':String(u.role||'');
  const config={enabled,mode:'priority_v673',updatedAt:Date.now(),updatedBy:{memberId:String(u.member_id||''),name:String(u.display_name||'').trim(),role,roleLabel:roleLabel(role)}};
  const next={...s,autoGame:config};
  const {data,error}=await db.from('kokmatch_state').update({data:next,revision:Number(row.revision||0)+1,updated_at:new Date().toISOString()}).eq('club_id',gid).eq('revision',Number(row.revision||0)).select('data,revision').maybeSingle();
  if(error)throw error;if(data)return {data:data.data,config};
 }
 throw new Error('다른 작업과 겹쳐 설정 저장이 지연됐습니다. 다시 시도해주세요.');
}

function capacityReason(s:any){
 const pending=Array.isArray(s.pendingGames)?s.pendingGames:[];
 const partials=pending.filter((g:any)=>Array.isArray(g?.players)&&g.players.length>0&&g.players.length<4);
 if(partials.length)return {stop:true,reason:'manual_partial_pending'};
 const games=Array.isArray(s.games)?s.games:[],courts=Math.max(1,Number(s.courtCount)||1),free=Math.max(0,courts-games.length),target=Math.max(1,free);
 const fullPending=pending.filter((g:any)=>Array.isArray(g?.players)&&g.players.length===4).length;
 if(fullPending>=target)return {stop:true,reason:'enough_pending'};
 return {stop:false,reason:'ready'};
}

async function tick(gid:string,u:any,global:boolean){
 let row=await loadRow(gid);if(!row)return {created:false,reason:'missing_state'};
 let s:any=row.data||{};if(!validateMemberSession(u,s,global))return {created:false,reason:'invalid_session'};
 let cfg=cfgOf(s);if(!cfg.enabled)return {created:false,reason:'disabled',data:s,config:cfg};
 let cap=capacityReason(s);if(cap.stop)return {created:false,reason:cap.reason,data:s,config:cfg};
 const baseRevision=Number(row.revision||0),started=Date.now();
 const best=bestFour(s),computeMs=Date.now()-started;
 if(!best)return {created:false,reason:'not_enough_waiting',data:s,config:cfg,computeMs};

 row=await loadRow(gid);if(!row)return {created:false,reason:'missing_state'};
 s=row.data||{};cfg=cfgOf(s);
 if(!cfg.enabled)return {created:false,reason:'disabled_before_write',data:s,config:cfg,computeMs};
 cap=capacityReason(s);if(cap.stop)return {created:false,reason:cap.reason,data:s,config:cfg,computeMs};
 if(Number(row.revision||0)!==baseRevision)return {created:false,reason:'state_changed',data:s,config:cfg,computeMs};

 const enabledBy=cfg.updatedBy||{};
 const body={players:best.players,forceRepeat:true,createdByMemberId:'',createdByName:'AI 자동편성',createdByRole:'시스템',createdByMode:'auto',autoEnabledByName:String(enabledBy.name||''),autoEnabledByRole:String(enabledBy.roleLabel||roleLabel(String(enabledBy.role||'')))};
 const {data,error}=await db.rpc('kokmatch_atomic_game_action',{p_gid:gid,p_action:'create_pending',p_body:body});
 if(error){
  const msg=String(error.message||'');
  if(/개인 게임대기|중복 인원|회원/.test(msg)){const latest=await loadRow(gid);return {created:false,reason:'state_changed',data:latest?.data||s,config:cfg,computeMs}}
  throw error;
 }
 return {created:true,players:best.players,decision:best.metrics,data,config:cfg,computeMs};
}

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return err('Not found',404);
 try{
  const u=await session(req);if(!u)return err('로그인이 필요합니다.',401);
  const b=await req.json().catch(()=>({}));const global=u.role==='admin'&&u.club_id===GLOBAL;const gid=global?String(b.groupId||'').trim():String(u.club_id||'').trim();
  if(!gid)return err('모임을 선택해주세요.',409);if(!global&&b.groupId&&String(b.groupId)!==gid)return err('다른 모임은 관리할 수 없습니다.',403);
  const action=String(b.action||'get');
  if(action==='get'){
   const row=await loadRow(gid);if(!row)return err('모임 상태를 찾을 수 없습니다.',404);
   if(!validateStaff(u,row.data||{},global))return err('개발자·모임장·운영진만 사용할 수 있습니다.',403);
   return ok({success:true,config:cfgOf(row.data||{}),data:row.data});
  }
  if(action==='set'){const x=await writeConfig(gid,u,global,b.enabled===true);return ok({success:true,...x})}
  if(action==='tick'){const x=await tick(gid,u,global);return ok({success:true,...x})}
  return err('지원하지 않는 작업입니다.',404);
 }catch(e){console.error(e);return err(e instanceof Error?e.message:'자동게임편성 처리 중 오류가 발생했습니다.',500)}
});
