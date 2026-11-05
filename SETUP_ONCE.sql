-- HOME FILM 신규 콘텐츠 기능. Supabase SQL Editor에서 관리자 검토 후 1회 실행.
-- admin_users(user_id uuid) 테이블과 기존 관리자 RLS 정책이 있어야 합니다.
create table if not exists public.film_gallery (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 title text not null check(length(title) between 1 and 100), category text not null,
 description text not null default '', image_path text not null unique,
 published boolean not null default true);
create table if not exists public.film_questions (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 author text not null check(length(author) between 1 and 30),
 title text not null check(length(title) between 1 and 100),
 body text not null check(length(body) between 1 and 2000),
 answer text, published boolean not null default false);
alter table public.film_gallery enable row level security;
alter table public.film_questions enable row level security;
-- 공개 조회: 승인된 게시글만.
create policy "gallery_public_read" on public.film_gallery for select to anon,authenticated using (published=true);
create policy "questions_public_read" on public.film_questions for select to anon,authenticated using (published=true);
-- 고객은 비공개 질문만 등록 가능. 개인정보는 질문에 기재하지 않도록 안내.
create policy "questions_public_insert" on public.film_questions for insert to anon,authenticated with check (published=false and answer is null);
-- 관리자는 모든 항목 조회·관리.
create policy "gallery_admin_all" on public.film_gallery for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "questions_admin_all" on public.film_questions for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
-- 사진 저장소: 공개 이미지 읽기, 관리자만 업로드·삭제.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('film-gallery','film-gallery',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "film_gallery_admin_upload" on storage.objects for insert to authenticated with check(bucket_id='film-gallery' and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
create policy "film_gallery_admin_delete" on storage.objects for delete to authenticated using(bucket_id='film-gallery' and exists(select 1 from public.admin_users a where a.user_id=(select auth.uid())));
