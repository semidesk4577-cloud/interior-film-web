/* HOME FILM STEP44: use the EXISTING .hero::before background on all screens.
   Avoid separate overlay layers and Image.onload gating. Public Supabase data only. */
(()=>{'use strict';
const hero=document.querySelector('.hero');if(!hero)return;
const title=hero.querySelector('h1'),body=hero.querySelector('.hero-content p');
const count=hero.querySelector('.hero-count');
const cfg=window.HOMEFILM_CONFIG||{};
let items=[],index=0,loading=false,ready=false,paused=false;
const normalize=rows=>(Array.isArray(rows)?rows:[])
 .filter(r=>r&&r.section==='hero'&&r.published!==false&&/^https:\/\//i.test(String(r.image_url||'')))
 .sort((a,b)=>Number(a.position||0)-Number(b.position||0));
const signature=arr=>arr.map(x=>[x.position,x.image_url,x.title,x.body].join('|')).join('||');
function show(n){
 if(!items.length)return;
 index=(n+items.length)%items.length;
 const r=items[index],url=String(r.image_url);
 // CSS :before is the visible banner on mobile AND desktop.
 hero.style.setProperty('--home-hero-image','url('+JSON.stringify(url)+')');
 if(title)title.textContent=r.title||'';
 if(body)body.textContent=r.body||'';
 if(count)count.textContent=(index+1)+' / '+items.length;
 // Older hero-slide layers must not cover the existing pseudo-element.
 hero.classList.remove('hero-rotation-ready');
}
function setRows(rows){
 const next=normalize(rows);
 if(!next.length)return;
 if(signature(next)===signature(items))return;
 items=next;ready=true;show(0);
}
window.addEventListener('homefilm:hero-content',e=>setRows(e.detail));
async function refresh(){
 if(loading)return;
 const base=String(cfg.supabaseUrl||'').replace(/\/$/,'');
 const key=String(cfg.supabasePublishableKey||'');
 if(!/^https:\/\//i.test(base)||!key)return;
 loading=true;
 try{
  const url=base+'/rest/v1/home_content?select=section,position,title,body,image_url,published&section=eq.hero&published=eq.true&order=position.asc';
  const res=await fetch(url,{headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  setRows(await res.json());
 }catch(e){console.warn('[HOME FILM STEP44] 배너 목록 조회 실패:',e.message);}
 finally{loading=false;}
}
// Existing buttons remain hidden; preserve optional functionality.
hero.querySelector('.hero-prev')?.addEventListener('click',()=>show(index-1));
hero.querySelector('.hero-next')?.addEventListener('click',()=>show(index+1));
hero.querySelector('.hero-toggle')?.addEventListener('click',()=>{paused=!paused;});
// Timer does not depend on focus/hover/mobile reduced-motion or image load events.
window.setInterval(()=>{if(!document.hidden&&!paused&&items.length>1)show(index+1);},5000);
refresh();window.setTimeout(refresh,3000);window.setTimeout(refresh,10000);
window.setInterval(()=>{if(items.length<2)refresh();},30000);
})();
