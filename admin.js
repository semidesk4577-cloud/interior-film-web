import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const $=id=>document.getElementById(id);
const say=text=>{$('msg').textContent=text;};
const valid=typeof cfg.supabaseUrl==='string'&&/^https:\/\/[^/]+\.supabase\.co\/?$/.test(cfg.supabaseUrl)&&typeof cfg.supabasePublishableKey==='string'&&cfg.supabasePublishableKey.startsWith('sb_publishable_');
let db=null,items=[];
let recoveryMode=false;
const showReset=()=>{$('loginSection').hidden=true;$('dashboard').hidden=true;$('resetSection').hidden=false;};
const showLogin=()=>{$('resetSection').hidden=true;$('dashboard').hidden=true;$('loginSection').hidden=false;};
if(!valid){say('공개 연결 설정을 확인해 주세요.');$('loginForm').querySelector('button').disabled=true;}
else{db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);initialize();}
const API='https://homefilm-api-production.up.railway.app';
async function refresh(){
  if(!db)return;
  say('MySQL 질문·상담 현황을 불러오는 중입니다...');
  try{
    const {data:{session},error}=await db.auth.getSession();
    if(error||!session?.access_token)throw Error('로그인이 필요합니다.');
    const response=await fetch(API+'/api/admin/moderation',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||!payload.ok||!Array.isArray(payload.items))throw Error('HTTP '+response.status+' '+(payload.code||'조회 실패'));
    const records=payload.items;
    const metrics={total:records.length,questionCount:records.filter(x=>x.kind==='question').length,consultationCount:records.filter(x=>x.kind==='consultation').length,newCount:records.filter(x=>x.status==='new').length,progressCount:records.filter(x=>x.status==='in_progress').length,completedCount:records.filter(x=>x.status==='closed').length};
    for(const [id,count] of Object.entries(metrics))$(id).textContent=String(count);
    say('MySQL 접수 현황을 불러왔습니다.');
  }catch(e){for(const id of ['total','questionCount','consultationCount','newCount','progressCount','completedCount'])$(id).textContent='—';say('현황 조회 실패: '+String(e.message||e)+' · 질문·상담 관리에서 확인해 주세요.');}
}
async function show(){
  const {data,error}=await db.auth.getSession();const session=data?.session;
  if(error){say('인증 상태 확인 실패: '+error.message);return;}
  if(recoveryMode){if(session){showReset();say('새 비밀번호를 설정해 주세요.');}else{showLogin();say('재설정 링크가 만료되었습니다. 새 링크를 요청해 주세요.');}return;}
  $('resetSection').hidden=true;$('loginSection').hidden=!!session;$('dashboard').hidden=true;
  if(session){window.location.replace('admin-intakes.html');return;}
}
async function processAuthCallback(){
  const hash=new URLSearchParams(location.hash.slice(1));const query=new URLSearchParams(location.search);
  const kind=hash.get('type')||query.get('type');
  const authError=hash.get('error_description')||query.get('error_description')||hash.get('error')||query.get('error');
  if(authError){history.replaceState(null,'',location.pathname);showLogin();say('인증 링크 오류: '+authError+'\n새 로그인 링크를 발급받아 주세요.');return;}
  recoveryMode=kind==='recovery';
  try{
    if(query.get('code')){const {error}=await db.auth.exchangeCodeForSession(query.get('code'));if(error)throw error;}
    if(hash.get('access_token')&&hash.get('refresh_token')){
      const {error}=await db.auth.setSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token')});if(error)throw error;
    }
    if(query.get('token_hash')&&query.get('type')){
      const {error}=await db.auth.verifyOtp({token_hash:query.get('token_hash'),type:query.get('type')});if(error)throw error;
    }
  }catch(e){history.replaceState(null,'',location.pathname);showLogin();say('로그인 링크 처리 실패: '+String(e.message||e));return;}
  if(location.hash||query.has('code')||query.has('token_hash'))history.replaceState(null,'',location.pathname);
  await show();
}

function initialize(){
$('forgotBtn').addEventListener('click',async()=>{const email=$('email').value.trim();if(!email){say('먼저 관리자 이메일을 입력해 주세요.');$('email').focus();return;}const btn=$('forgotBtn');btn.disabled=true;let error=null;try{({error}=await db.auth.resetPasswordForEmail(email,{redirectTo:'https://www.homefilm.co.kr/admin.html'}));}catch(ex){error=ex;}btn.disabled=false;if(error){const details=String(error.message||'알 수 없는 오류');const guidance=/rate.limit|too many|429/i.test(details)?'잠시 기다린 후 다시 요청해 주세요.':/redirect|not.allowed|invalid.*url/i.test(details)?'Supabase Authentication → URL Configuration에서 현재 관리자 주소를 Redirect URLs에 등록해야 합니다.':'메일 발송 설정 또는 발송 제한 문제일 수 있습니다. 홈페이지 소스만으로는 해결할 수 없습니다.';say('재설정 요청 실패: '+details+'\n'+guidance);}else say('재설정 메일을 요청했습니다. 스팸함도 확인해 주세요.');});
$('backToLogin').addEventListener('click',()=>{recoveryMode=false;history.replaceState(null,'',location.pathname);showLogin();say('로그인 화면으로 돌아왔습니다.');});
$('resetForm').addEventListener('submit',async e=>{e.preventDefault();const p=$('newPassword').value;if(p!==$('confirmPassword').value){say('새 비밀번호가 일치하지 않습니다.');return;}if(p.length<8){say('비밀번호는 8자 이상으로 입력하세요.');return;}const btn=$('resetForm').querySelector('button[type=submit]');btn.disabled=true;const {error}=await db.auth.updateUser({password:p});btn.disabled=false;if(error){say('비밀번호 변경에 실패했습니다. 재설정 링크의 유효기간을 확인하세요.');return;}$('resetForm').reset();recoveryMode=false;await db.auth.signOut();history.replaceState(null,'',location.pathname);showLogin();say('비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.');});
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const button=$('loginForm').querySelector('button');button.disabled=true;const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});$('password').value='';button.disabled=false;if(error){say('로그인 실패: '+String(error.message||'계정 정보를 확인하세요.'));return;}await show();});$('logout').addEventListener('click',async()=>{await db.auth.signOut();say('로그아웃되었습니다.');await show();});$('refresh').addEventListener('click',refresh);db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY'){recoveryMode=true;showReset();say('새 비밀번호를 설정해 주세요.');}if(event==='SIGNED_OUT'&&!(!$('resetSection').hidden)){$('dashboard').hidden=true;$('loginSection').hidden=false;}});processAuthCallback().catch(e=>say('인증 연결 확인 실패: '+String(e.message||e)));}
