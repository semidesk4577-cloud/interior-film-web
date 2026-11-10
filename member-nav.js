// HOME FILM STEP09: header-only member navigation. No homepage member panel.
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const ids=['memberLoginLink','memberSignupLink','memberPageLink','memberLogoutLink'];
const links=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
function render(logged){
  links.memberLoginLink.hidden=logged;
  links.memberSignupLink.hidden=logged;
  links.memberPageLink.hidden=!logged;
  links.memberLogoutLink.hidden=!logged;
}
render(false);
if(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.supabaseUrl||'') && cfg.supabasePublishableKey){
  const auth=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey).auth;
  auth.getSession().then(({data,error})=>{if(!error)render(!!data?.session?.user)}).catch(()=>render(false));
  auth.onAuthStateChange((_event,session)=>render(!!session?.user));
  links.memberLogoutLink.addEventListener('click',async e=>{
    e.preventDefault();
    const {error}=await auth.signOut();
    if(error){alert('로그아웃에 실패했습니다. 다시 시도해 주세요.');return;}
    render(false);
    location.assign('/');
  });
}
