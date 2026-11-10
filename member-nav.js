// HOME FILM: auth-aware header. Admin role is checked via RLS-protected admin_users.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const get=id=>document.getElementById(id);
const links={login:get('memberLoginLink'),signup:get('memberSignupLink'),page:get('memberPageLink'),logout:get('memberLogoutLink'),admin:get('memberAdminLink')};
const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'')&&!!cfg.supabasePublishableKey;
function render(role){
 if(links.login)links.login.hidden=role!=='guest';
 if(links.signup)links.signup.hidden=role!=='guest';
 if(links.page)links.page.hidden=role!=='member';
 if(links.admin)links.admin.hidden=role!=='admin';
 if(links.logout)links.logout.hidden=role==='guest';
}
render('guest');
if(configured){
 const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 let generation=0;
 async function update(session){
  const current=++generation;
  if(!session?.user){render('guest');return;}
  // Fail closed: no administrator UI without a verified role.
  try{
   const {data,error}=await db.from('admin_users').select('user_id').eq('user_id',session.user.id).maybeSingle();
   if(current!==generation)return;
   render(!error&&data?'admin':'member');
  }catch(e){if(current===generation)render('member');}
 }
 db.auth.getSession().then(({data})=>update(data?.session)).catch(()=>render('guest'));
 db.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>update(session),0)});
 if(links.logout)links.logout.addEventListener('click',async e=>{
  e.preventDefault();const {error}=await db.auth.signOut();
  if(error){alert('로그아웃에 실패했습니다.');return;}
  render('guest');location.assign('/');
 });
}
