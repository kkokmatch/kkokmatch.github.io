import postgres from 'npm:postgres@3.4.7';
import {project,change} from './board.mjs';

const sql=postgres(Deno.env.get('SUPABASE_DB_URL')!,{prepare:false,max:3});
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const send=(body:unknown,status=200)=>Response.json(body,{status,headers});
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return send({},405);
  const token=(req.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1];
  if(!token)return send({error:'로그인이 필요합니다.'},401);
  try{
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),n=>n.toString(16).padStart(2,'0')).join('');
    const b=await req.json(),write=b.action!=='read';
    return await sql.begin(async tx=>{
      const [u]=await tx`select club_id,member_id,role,display_name from public.kokmatch_sessions where token_hash=${hash} and expires_at>now()`;
      if(!u)return send({error:'로그인이 만료되었습니다.'},401);
      const global=u.club_id==='__global__'&&u.role==='admin';
      const gid=String(b.groupId||'');
      if(!gid||gid==='__global__'||(!global&&u.club_id!==gid))return send({error:'모임 접근 권한이 없습니다.'},403);
      const get=async(lock=false)=>(await tx`select data,revision,md5(data::text) as stamp from public.kokmatch_state where club_id=${gid} ${lock?tx`for update`:tx``}`)[0];
      let row=await get(write);
      if(!row)return send({error:'편성판을 찾을 수 없습니다.'},404);
      const s=row.data,actor=s.members.find((m:any)=>m.id===u.member_id);
      if(!global&&(!actor||(actor.role||'member')!==u.role))return send({error:'회원 권한을 확인해주세요.'},403);
      const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul'}).format(new Date());
      const edit=global||['manager','organizer'].includes(u.role)||(actor?.role==='member'&&actor.type!=='guest'&&actor.state!=='out'&&actor.tempOrganizerDay===day);
      const owner=String(u.member_id||'__global__');
      const undo=(r:any)=>r.data.boardUndo?.owner===owner && Number(r.data.boardUndo?.revision)===Number(r.revision);
      if(write) {
        if(!edit && !(b.action==='finish'&&actor&&actor.type!=='guest'))return send({error:'편성 권한이 없습니다.'},403);
        if(b.stamp!==row.stamp)return send({error:'다른 기기에서 편성판을 변경했습니다. 최신 위치를 확인해주세요.'},409);
        const v=project(s);
        if(b.action==='start'||b.action==='finish'){
          const start=b.action==='start',court=Number(String(b.zone).replace(/^court-/,''));
          if(!/^court-[1-9]\d*$/.test(b.zone)||court>s.courtCount||!Object.hasOwn(v.zones,b.zone))return send({error:'코트를 확인해주세요.'},409);
          if(start?(v.games[b.zone]||v.zones[b.zone].filter(Boolean).length!==4):!v.games[b.zone])return send({error:'경기 상태가 변경되었습니다.'},409);
          const body=start?{court,pendingId:v.groups[b.zone]}:{gameId:v.games[b.zone]};
          await tx`select public.kokmatch_atomic_game_action(${gid},${start?'begin_game':'finish_game'},${tx.json(body)})`;
        }else{
          if(b.action==='undo'&&!undo(row))return send({error:'다른 변경 이후에는 실행 취소할 수 없습니다.'},409);
          try{change(s,b,v,Date.now(),{createdByMemberId:owner,createdByName:u.display_name,createdByRole:global?'개발자':u.role==='manager'?'모임장':u.role==='organizer'?'운영진':'임시편성자'});}
          catch(e){return send({error:e.message,warning:e.code},409);}
          if(s.boardUndo)s.boardUndo.revision=Number(row.revision)+1;
          await tx`update public.kokmatch_state set data=${tx.json(s)},revision=revision+1 where club_id=${gid}`;
        }
        row=await get();
      }
      return send({board:project(row.data),stamp:row.stamp,serverNow:Date.now(),edit,finish:edit||!!actor&&actor.type!=='guest',undo:undo(row)});
    });
  }catch(e){console.error('board request failed',e.code||e.name);return send({error:'편성판 요청을 처리하지 못했습니다.'},500);}
});
