/* HOME FILM STEP48: single-background hero; native REST plus existing content events. */
(()=>{'use strict';
const hero=document.querySelector('.hero');if(!hero)return;
const title=hero.querySelector('h1'),body=hero.querySelector('.hero-content p'),count=hero.querySelector('.hero-count');
let rows=[],idx=0,paused=false,requestBusy=false,failures=[];
const isUrl=x=>/^https:\/\//i.test(String(x||''));
const normalize=data=>(Array.isArray(data)?data:[]).filter(r=>r&&r.section==='hero'&&r.published!==false&&isUrl(r.image_url)).sort((a,b)=>(Number(a.position)||0)-(Number(b.position)||0));
const signature=data=>data.map(r=>[r.position,r.image_url,r.title,r.body].join('|')).join('||');
function show(n){if(!rows.length)return;idx=(n+rows.length)%rows.length;
 const r=rows[idx];hero.style.setProperty('--home-hero-image','url('+JSON.stringify(String(r.image_url))+')');
 if(title)title.textContent=r.title||'';if(body)body.textContent=r.body||'';
 if(count)count.textContent=(idx+1)+' / '+rows.length;
 updateDebug();
}
function receive(data){const next=normalize(data);if(!next.length)return;
 if(signature(next)===signature(rows))return;
 rows=next;idx=0;show(0);
 // Warm remaining images without delaying rotation.
 next.slice(1).forEach(r=>{const img=new Image();img.src=r.image_url});
}
window.addEventListener('homefilm:hero-content',e=>receive(e.detail));
window.addEventListener('homefilm:content-ready',e=>receive(e.detail));
if(window.HOMEFILM_CONTENT_ROWS)receive(window.HOMEFILM_CONTENT_ROWS);
hero.querySelector('.hero-prev')?.addEventListener('click',()=>show(idx-1));
hero.querySelector('.hero-next')?.addEventListener('click',()=>show(idx+1));
hero.querySelector('.hero-toggle')?.addEventListener('click',()=>{paused=!paused});
// Native REST avoids dependence on an external JavaScript module CDN.
async function refresh(){if(requestBusy||rows.length)return;
 const cfg=window.HOMEFILM_CONFIG||{},base=String(cfg.supabaseUrl||'').replace(/\/$/,''),key=String(cfg.supabasePublishableKey||'');
 if(!isUrl(base)||!key){failures.push('config missing');updateDebug();return}
 requestBusy=true;
 try{
  const endpoint=base+'/rest/v1/home_content?select=section,position,title,body,image_url,published&section=eq.hero&published=eq.true&order=position.asc';
  const headers={apikey:key,Accept:'application/json'};
  // Only legacy JWT anon keys are suitable as Bearer credentials.
  if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
  const resp=await fetch(endpoint,{headers,cache:'no-store'});
  if(!resp.ok)throw Error('REST HTTP '+resp.status);
  receive(await resp.json());
 }catch(e){failures.push(String(e.message||e));console.warn('[HOME FILM hero]',e)}
 finally{requestBusy=false;updateDebug()}
}
function updateDebug(){if(!new URLSearchParams(location.search).has('heroDebug'))return;
 let el=document.getElementById('homefilm-hero-debug');
 if(!el){el=document.createElement('div');el.id='homefilm-hero-debug';el.style.cssText='position:fixed;z-index:99999;bottom:8px;left:8px;right:8px;background:#fff;color:#111;border:2px solid #222;padding:8px;font:12px/1.5 monospace;white-space:pre-wrap;max-height:130px;overflow:auto';document.body.append(el)}
 el.textContent='STEP48 | width='+innerWidth+' | hero rows='+rows.length+' | current='+(idx+1)+' | errors='+failures.slice(-3).join(', ');
}
window.setInterval(()=>{if(!paused&&rows.length>1)show(idx+1)},5000);
refresh();window.setTimeout(refresh,2500);window.setTimeout(refresh,8000);
updateDebug();
})();
