/* HOME FILM STEP47: use the SAME Supabase SDK data as home-content.js. */
(()=>{'use strict';
const hero=document.querySelector('.hero');if(!hero)return;
const title=hero.querySelector('h1'),body=hero.querySelector('.hero-content p');
const photo=hero.querySelector('.hero-mobile-photo'),count=hero.querySelector('.hero-count');
let items=[],index=0,paused=false;
const clean=rows=>(Array.isArray(rows)?rows:[]).filter(r=>r&&r.section==='hero'&&r.published!==false&&/^https:\/\//i.test(String(r.image_url||''))).sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0));
function show(n){if(!items.length)return;index=(n+items.length)%items.length;
 const r=items[index],url=String(r.image_url);
 hero.style.setProperty('--home-hero-image','url('+JSON.stringify(url)+')');
 if(photo&&photo.getAttribute('src')!==url){hero.classList.remove('hero-photo-loaded');photo.onload=()=>{if(photo.getAttribute('src')===url)hero.classList.add('hero-photo-loaded')};photo.onerror=()=>hero.classList.remove('hero-photo-loaded');photo.src=url;}
 if(title)title.textContent=r.title||'';if(body)body.textContent=r.body||'';
 if(count)count.textContent=(index+1)+' / '+items.length;
}
function receive(rows){const next=clean(rows);if(!next.length)return;
 const sign=x=>x.map(r=>[r.position,r.image_url,r.title,r.body].join('|')).join('||');
 if(sign(next)===sign(items))return;items=next;show(0);
}
window.addEventListener('homefilm:hero-content',e=>receive(e.detail));
window.addEventListener('homefilm:content-ready',e=>receive(e.detail));
if(window.HOMEFILM_CONTENT_ROWS)receive(window.HOMEFILM_CONTENT_ROWS);
hero.querySelector('.hero-prev')?.addEventListener('click',()=>show(index-1));
hero.querySelector('.hero-next')?.addEventListener('click',()=>show(index+1));
hero.querySelector('.hero-toggle')?.addEventListener('click',()=>{paused=!paused});
window.setInterval(()=>{if(!paused&&items.length>1)show(index+1)},5000);
// SDK fallback only when the module did not deliver content (e.g. module CDN unavailable).
window.setTimeout(async()=>{if(items.length)return;const cfg=window.HOMEFILM_CONFIG||{};
 try{const sdk=await import('https://esm.sh/@supabase/supabase-js@2');
 const db=sdk.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 const {data,error}=await db.from('home_content').select('section,position,title,body,image_url').eq('published',true).eq('section','hero').order('position',{ascending:true});
 if(error)throw error;receive(data);
 }catch(e){console.warn('[HOME FILM STEP47] SDK hero fetch failed',e.message)}
},3500);
})();
