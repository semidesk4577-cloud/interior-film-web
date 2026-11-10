
-- Run once in the existing Supabase SQL Editor (NOT Railway MySQL).
-- Existing images/content remain unchanged until edited by an admin.
create table if not exists public.home_content(
 id uuid primary key default gen_random_uuid(),
 section text not null check(section in ('hero','about','service','work')),
 position integer not null default 1 check(position between 1 and 999),
 title text not null,
 body text not null default '',
 image_url text,
 published boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists home_content_section_position_idx on public.home_content(section,position);
alter table public.home_content enable row level security;
drop policy if exists "home_content_public_read" on public.home_content;
create policy "home_content_public_read" on public.home_content for select to anon,authenticated using (published=true or exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "home_content_admin_insert" on public.home_content;
create policy "home_content_admin_insert" on public.home_content for insert to authenticated with check(exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "home_content_admin_update" on public.home_content;
create policy "home_content_admin_update" on public.home_content for update to authenticated using(exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check(exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "home_content_admin_delete" on public.home_content;
create policy "home_content_admin_delete" on public.home_content for delete to authenticated using(exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
-- Image uploads reuse the existing 'film-gallery' bucket and its admin storage policy.

-- Seed current website content exactly once; do not overwrite later admin edits.
insert into public.home_content(section,position,title,body,image_url) select 'hero',1,'바꾸는 건 표면,
달라지는 건 공간.','익숙한 집에 새로운 분위기를 더하는 인테리어 필름.
작은 부분부터 섬세하게, 필요한 곳만 새롭게.','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85' where not exists(select 1 from public.home_content where section='hero' and position=1);
insert into public.home_content(section,position,title,body,image_url) select 'about',1,'좋은 변화는
섬세한 손끝에서
시작됩니다.','무조건 새것으로 바꾸기보다, 지금의 공간을 더 오래 아끼는 방법을 고민합니다. 생활의 동선과 기존 가구의 상태를 살피고 적합한 시공 방법을 안내하겠습니다.','https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1100&q=85' where not exists(select 1 from public.home_content where section='about' and position=1);
insert into public.home_content(section,position,title,body,image_url) select 'service',1,'방문 · 문틀','낡거나 색이 바랜 문을 새로운 톤으로','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80' where not exists(select 1 from public.home_content where section='service' and position=1);
insert into public.home_content(section,position,title,body,image_url) select 'service',2,'싱크대 · 주방','주방 가구 표면을 깔끔하게 리폼','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80' where not exists(select 1 from public.home_content where section='service' and position=2);
insert into public.home_content(section,position,title,body,image_url) select 'service',3,'붙박이장 · 신발장','가구를 교체하지 않고 분위기 전환','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80' where not exists(select 1 from public.home_content where section='service' and position=3);
insert into public.home_content(section,position,title,body,image_url) select 'service',4,'부분 리폼','작은 면적도 사진으로 먼저 상담','https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=800&q=80' where not exists(select 1 from public.home_content where section='service' and position=4);
insert into public.home_content(section,position,title,body,image_url) select 'work',1,'주방 리폼 참고','실제 시공 사례 등록 예정','https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=85' where not exists(select 1 from public.home_content where section='work' and position=1);
insert into public.home_content(section,position,title,body,image_url) select 'work',2,'방문 리폼 참고','실제 시공 사례 등록 예정','https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=85' where not exists(select 1 from public.home_content where section='work' and position=2);
insert into public.home_content(section,position,title,body,image_url) select 'work',3,'수납장 리폼 참고','실제 시공 사례 등록 예정','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85' where not exists(select 1 from public.home_content where section='work' and position=3);
