import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const $=id=>document.getElementById(id);
const status=$('status'),rows=$('rows');let page=1,next=null,items=[];
const date=v=>v?new Date(v).toLocaleDateString('ko-KR'):'—';
const show=(msg,error=false)=>{status.textContent=msg;status.classList.toggle('error',error);};
function render(){const term=$('search').value.trim().toLowerCase();rows.replaceChildren();const found=items.filter(u=>u.email.toLowerCase().includes(term));for(const u of found){const tr=document.createElement('tr');for(const v of [u.email,date(u.created_at),date(u.last_sign_in_at),u.email_confirmed_at?'인증':'미인증',u.banned_until&&new Date(u.banned_until)>new Date()?'제한':'정상']){const td=document.createElement('td');td.textContent=v;tr.append(td);}rows.append(tr);}if(!found.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent='표시할 회원이 없습니다.';tr.append(td);rows.append(tr);}$('page').textContent=page+'페이지';$('prev').disabled=page===1;$('next').disabled=!next;}
const valid=/^https:\/\/[^/]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'')&&typeof cfg.supabasePublishableKey==='string';
if(!valid){show('인증 연결 설정을 확인하세요.',true);}else{
 const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 async function load(target=page){show('회원 목록을 불러오는 중입니다.');$('refresh').disabled=true;try{const {data:{session},error}=await db.auth.getSession();if(error||!session?.access_token){show('관리자 로그인이 필요합니다. 관리자 로그인 화면으로 이동하세요.',true);return;}
 const r=await fetch('https://homefilm-api-production.up.railway.app/api/admin/members?page='+target,{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});const result=await r.json().catch(()=>({}));if(!r.ok||!result.ok)throw Error('HTTP '+r.status+' '+(result.code||'조회 실패'));page=target;items=result.items||[];next=result.nextPage;render();show('회원 '+items.length+'명 표시 · '+page+'페이지 (페이지당 최대 50명)');}catch(e){show('회원 목록 조회 실패: '+String(e.message||e),true);}finally{$('refresh').disabled=false;}}
 $('refresh').onclick=()=>load();$('prev').onclick=()=>{if(page>1)load(page-1)};$('next').onclick=()=>{if(next)load(next)};$('search').oninput=render;load(1);
}
