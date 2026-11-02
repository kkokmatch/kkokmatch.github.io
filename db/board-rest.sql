-- Apply to completed games from every client, including the scheduled finish.
create or replace function public.kokmatch_finished_to_rest()
returns trigger language plpgsql set search_path='' as $$
declare ids text[];
begin
  select array_agg(distinct pid) into ids
  from jsonb_array_elements(coalesce(old.data->'games','[]')) g
  cross join lateral jsonb_array_elements_text(g->'players') pid
  where not exists (select from jsonb_array_elements(coalesce(new.data->'games','[]')) n where n->>'id'=g->>'id')
    and exists (select from jsonb_array_elements(coalesce(new.data->'history','[]')) h where h->>'id'=g->>'id' and h->>'endedAt' is not null);
  if ids is null then return new; end if;
  new.data=jsonb_set(new.data,'{members}',(select jsonb_agg(case when m->>'id'=any(ids) and m->>'state'='waiting' then m||'{"state":"spectator","boardRest":true,"joinedAt":null}'::jsonb else m end order by i) from jsonb_array_elements(new.data->'members') with ordinality as x(m,i)));
  new.data=jsonb_set(new.data,'{queue}',coalesce((select jsonb_agg(id order by i) from jsonb_array_elements_text(new.data->'queue') with ordinality as q(id,i) where not id=any(ids)),'[]'::jsonb));
  return new;
end $$;
revoke all on function public.kokmatch_finished_to_rest() from public,anon,authenticated;
create or replace trigger kokmatch_board_finish before update of data on public.kokmatch_state
for each row when ((old.data->'games') is distinct from (new.data->'games')) execute function public.kokmatch_finished_to_rest();

-- Existing clients receive the committed (post-trigger) state in the same response.
do $migration$
declare
  original text := pg_get_functiondef('public.kokmatch_atomic_game_action(text,text,jsonb)'::regprocedure);
  previous text := 'update kokmatch_state set data=s, revision=revision+1, updated_at=clock_timestamp() where club_id=p_gid;';
  replacement text := 'update kokmatch_state set data=s, revision=revision+1, updated_at=clock_timestamp() where club_id=p_gid returning data into s;';
begin
  if strpos(original,replacement)>0 then return; end if;
  if strpos(original,previous)=0 then raise exception 'Atomic game function changed. Review migration before applying.'; end if;
  execute replace(original,previous,replacement);
end $migration$;
