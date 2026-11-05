import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const msg=document.getElementById('msg');
if(!cfg.supabasePublishableKey || cfg.supabasePublishableKey.startsWith('PASTE_')) {msg.textContent='config.js의 공개 연결 설정을 먼저 완료해 주세요.';throw Error('Missing public config');}
const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const login=document.getElementById('loginSection'),dashboard=document.getElementById('dashboard'),rows=document.getElementById('rows');
const say=t=>{msg.textContent=t;};
function cell(tr,value){const td=document.createElement('td');td.textContent=value??'';tr.appendChild(td);return td;}
async function refresh(){const {data,error}=await db.from('inquiries').select('id,created_at,customer_name,phone,location,service_type,message,status').order('created_at',{ascending:false}).limit(200);if(error){say('문의 목록 접근 실패: 관리자 권한을 확인해 주세요.');return;}rows.replaceChildren();for(const item of data){const tr=document.createElement('tr');cell(tr,new Date(item.created_at).toLocaleString('ko-KR'));cell(tr,item.customer_name);cell(tr,item.phone);cell(tr,[item.location,item.service_type].filter(Boolean).join(' / '));cell(tr,item.message);const td=document.createElement('td');const select=document.createElement('select');for(const [v,label] of [['new','신규'],['contacted','연락 완료'],['completed','처리 완료']]){const o=document.createElement('option');o.value=v;o.textContent=label;select.appendChild(o);}select.value=item.status;select.addEventListener('change',async()=>{select.disabled=true;const {error}=await db.from('inquiries').update({status:select.value}).eq('id',item.id);select.disabled=false;if(error){say('상태 변경에 실패했습니다.');select.value=item.status;}else{item.status=select.value;say('처리 상태를 저장했습니다.');}});td.appendChild(select);tr.appendChild(td);rows.appendChild(tr);}say(`${data.length}건의 문의를 표시합니다.`);}
async function show(){const {data:{session}}=await db.auth.getSession();login.hidden=!!session;dashboard.hidden=!session;if(session)await refresh();}
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const {error}=await db.auth.signInWithPassword({email:document.getElementById('email').value,password:document.getElementById('password').value});document.getElementById('password').value='';if(error){say('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');return;}await show();});
document.getElementById('logout').addEventListener('click',async()=>{await db.auth.signOut();rows.replaceChildren();say('로그아웃되었습니다.');await show();});
document.getElementById('refresh').addEventListener('click',refresh);
show().catch(()=>say('연결을 확인해 주세요.'));
