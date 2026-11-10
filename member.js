import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const $=id=>document.getElementById(id);
const msg=(s,err=false)=>{const el=$('status');if(el){el.textContent=s;el.classList.toggle('error',err)}};
const safeError=e=>{const m=String(e?.message||'알 수 없는 오류');return /invalid login credentials/i.test(m)?'이메일 또는 비밀번호를 확인해 주세요.':/email not confirmed/i.test(m)?'이메일 인증을 완료해 주세요.':m};
const isConfigured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')&&!!cfg.supabasePublishableKey;
const db=isConfigured?createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{flowType:'pkce',autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}):null;
if(!db)msg('Supabase 연결 설정이 없습니다. config.js를 확인하세요.',true);
const withButton=async(form,action)=>{const btn=form.querySelector('button[type=submit]');btn.disabled=true;try{await action()}catch(e){msg(safeError(e),true)}finally{btn.disabled=false}};
if($('signup'))$('signup').addEventListener('submit',e=>{e.preventDefault();if(!db)return;withButton(e.currentTarget,async()=>{
 const name=$('name').value.trim(),email=$('email').value.trim(),password=$('password').value;
 if(!name)throw Error('이름을 입력해 주세요.');
 if(password!==$('confirm').value)throw Error('비밀번호가 일치하지 않습니다.');
 if(!$('agree').checked)throw Error('필수 동의를 확인해 주세요.');
 const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:new URL('login.html',location.href).href}});
 if(error)throw error;
 msg(data.session?'가입이 완료되었습니다. 로그인 후 이용해 주세요.':'가입 요청을 접수했습니다. 이메일 인증 링크를 확인해 주세요.');
 });});
if($('login'))$('login').addEventListener('submit',e=>{e.preventDefault();if(!db)return;withButton(e.currentTarget,async()=>{
 const {error}=await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
 if(error)throw error;location.replace('/');
 });});
if($('reset'))$('reset').addEventListener('click',async e=>{e.preventDefault();if(!db)return;const email=$('email').value.trim();if(!email){msg('이메일을 먼저 입력해 주세요.',true);return;}try{const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:new URL('mypage.html',location.href).href});if(error)throw error;msg('비밀번호 재설정 안내 메일을 요청했습니다.')}catch(err){msg(safeError(err),true)}});
if($('who'))(async()=>{if(!db)return;const {data,error}=await db.auth.getUser();if(error||!data.user){location.replace('login.html');return;}$('who').textContent=`로그인 계정: ${data.user.email||'회원'}`;})();
if($('logout'))$('logout').addEventListener('click',async()=>{if(!db)return;const {error}=await db.auth.signOut();if(error){msg(safeError(error),true);return;}location.replace('login.html')});
