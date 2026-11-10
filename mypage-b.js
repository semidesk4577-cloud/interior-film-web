import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const $=id=>document.getElementById(id);
const api='https://homefilm-api-production.up.railway.app';
const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')&&!!cfg.supabasePublishableKey;
const db=configured?createClient(cfg.supabaseUrl,cfg.supabasePublishableKey):null;
let currentUser=null,session=null,widgetId=null;
const say=(id,s)=>{if($(id))$(id).textContent=s};
const errorText=async r=>{let j={};try{j=await r.json()}catch{}return 'HTTP '+r.status+(j.code?' ('+j.code+')':'')};
function itemView(q){
 const a=document.createElement('article');a.className='q-item';
 const h=document.createElement('h3');h.textContent=q.title||'시공 상담';a.append(h);
 const m=document.createElement('p');m.className='q-meta';m.textContent=({new:'접수',in_progress:'처리 중',closed:'완료'}[q.status]||'접수')+' · '+(q.created_at?new Date(q.created_at).toLocaleDateString('ko-KR'):'');a.append(m);
 const p=document.createElement('p');p.textContent=q.body||'';a.append(p);
 if(q.answer){const d=document.createElement('div');d.className='q-answer';d.textContent='관리자 답변: '+q.answer;a.append(d)}return a;
}
async function refreshSession(){const {data,error}=await db.auth.getSession();if(error)throw error;session=data.session;if(!session){location.replace('login.html');return false}return true}
async function loadQuestions(){
 say('questionStatus','내 상담 내역을 조회하고 있습니다.');
 try{if(!await refreshSession())return;
 const r=await fetch(api+'/api/member/questions',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
 if(!r.ok)throw Error(await errorText(r));const j=await r.json();if(j.ok!==true||!Array.isArray(j.items))throw Error('응답 형식 오류');
 $('myQuestions').replaceChildren();j.items.forEach(q=>$('myQuestions').append(itemView(q)));
 say('questionStatus',j.items.length?'내 질문 '+j.items.length+'건':'아직 등록된 회원 질문이 없습니다.');
 }catch(e){say('questionStatus','회원 상담 내역 조회 실패: '+e.message+' — Railway API 및 member_id DB 설정을 확인해야 합니다.');}
}
async function setupTurnstile(){
 const button=$('askForm').querySelector('button[type=submit]');
 if(!cfg.turnstileSiteKey){button.disabled=true;say('askStatus','스팸 방지 설정이 없습니다.');return}
 try{if(!window.turnstile)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;s.onload=resolve;s.onerror=reject;document.head.append(s)});
 widgetId=window.turnstile.render('#memberTurnstile',{sitekey:cfg.turnstileSiteKey,theme:'light'});
 }catch{button.disabled=true;say('askStatus','스팸 방지 인증을 불러오지 못했습니다.');}
}
async function init(){
 if(!db){say('status','Supabase 연결 설정을 확인해 주세요.');return}
 try{if(!await refreshSession())return;const {data,error}=await db.auth.getUser();if(error||!data.user){location.replace('login.html');return}currentUser=data.user;
 $('who').textContent=currentUser.email||'회원';const author=$('askForm').elements.author;author.value=currentUser.user_metadata?.display_name||currentUser.email?.split('@')[0]||'';
 await Promise.all([loadQuestions(),setupTurnstile()]);
 }catch(e){say('status','회원 인증 오류: '+e.message)}
}
$('logout').addEventListener('click',async()=>{if(!db)return;const {error}=await db.auth.signOut();if(error){say('status','로그아웃 실패: '+error.message);return}location.replace('/')});
$('resetPassword').addEventListener('click',async()=>{if(!db||!currentUser)return;say('accountStatus','요청 중입니다.');const {error}=await db.auth.resetPasswordForEmail(currentUser.email,{redirectTo:new URL('login.html',location.href).href});say('accountStatus',error?'요청 실패: '+error.message:'비밀번호 변경 안내 메일을 발송 요청했습니다. 메일함을 확인해 주세요.')});
$('askForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db||widgetId===null)return;
 const token=window.turnstile?.getResponse(widgetId);if(!token){say('askStatus','스팸 방지 인증을 완료해 주세요.');return}
 const form=e.currentTarget,btn=form.querySelector('button[type=submit]'),fd=new FormData(form);
 const payload={author:String(fd.get('author')||'').trim(),title:String(fd.get('title')||'').trim(),body:String(fd.get('body')||'').trim(),turnstile_token:token};
 if(!payload.author||!payload.title||!payload.body){say('askStatus','모든 항목을 입력해 주세요.');return}
 btn.disabled=true;say('askStatus','질문을 등록하고 있습니다.');
 try{if(!await refreshSession())return;
 const r=await fetch(api+'/api/member/questions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify(payload)});
 if(!r.ok)throw Error(await errorText(r));const j=await r.json();if(j.ok!==true)throw Error('서버 응답 오류');
 form.elements.title.value='';form.elements.body.value='';say('askStatus','질문이 정상 접수되었습니다. 아래 내 상담 내역에서 확인하세요.');await loadQuestions();
 }catch(err){say('askStatus','질문 접수 실패: '+err.message+' — 입력한 내용은 유지됩니다.')}
 finally{window.turnstile?.reset(widgetId);btn.disabled=false}
});
init();
