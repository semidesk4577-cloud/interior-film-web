/* HOME FILM STEP43: robust mobile hero rotation. Public content only. */
(()=>{'use strict';
const root=document.querySelector('.hero'),cfg=window.HOMEFILM_CONFIG||{};
if(!root)return;
const layers=[root.querySelector('.hero-slide-a'),root.querySelector('.hero-slide-b')];
const title=root.querySelector('h1'),body=root.querySelector('.hero-content p');
if(layers.some(x=>!x)||!title||!body)return;
let rows=[],position=0,active=0,busy=false,stopped=false,hovered=false,loading=false;
const count=root.querySelector('.hero-count');
const valid=x=>x&&x.section==='hero'&&x.published!==false&&/^https:\/\//i.test(String(x.image_url||''));
const sort=(a,b)=>Number(a.position||0)-Number(b.position||0);
function setRows(list){
 const fresh=(Array.isArray(list)?list:[]).filter(x=>x&&/^https:\/\//i.test(String(x.image_url||''))).sort(sort);
 if(!fresh.length)return;
 const signature=a=>a.map(x=>[x.position,x.image_url,x.title,x.body].join('|')).join('||');
 if(signature(fresh)===signature(rows))return;
 rows=fresh;position=0;display(0,true);
}
function display(target,first=false){
 if(!rows.length||busy)return;
 busy=true;
 const i=(target+rows.length)%rows.length,item=rows[i],url=String(item.image_url||'');
 const layer=layers[first?active:1-active];
 // Keep text and image in sync, and never let a broken image block subsequent slides.
 const image=new Image();let done=false;
 const finish=ok=>{
  if(done)return;done=true;busy=false;
  if(!ok){console.warn('[HOME FILM] 배너 이미지 로딩 실패:',url);return;}
  layer.style.backgroundImage='url('+JSON.stringify(url)+')';
  layer.classList.add('is-visible');layers[1-(first?active:1-active)].classList.remove('is-visible');
  active=first?active:1-active;position=i;
  title.textContent=item.title||'';body.textContent=item.body||'';
  if(count)count.textContent=(position+1)+' / '+rows.length;
  root.classList.add('hero-rotation-ready');
 };
 image.onload=()=>finish(true);image.onerror=()=>finish(false);
 image.src=url;
 setTimeout(()=>finish(false),4500);
}
function advance(){if(rows.length>1&&!busy)display(position+1);}
async function fetchRows(){
 if(loading||!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
 loading=true;
 try{
  const url=String(cfg.supabaseUrl).replace(/\/$/,'')+'/rest/v1/home_content?select=section,position,title,body,image_url,published&section=eq.hero&published=eq.true&order=position.asc';
  const res=await fetch(url,{headers:{apikey:cfg.supabasePublishableKey,Authorization:'Bearer '+cfg.supabasePublishableKey},cache:'no-store'});
  if(!res.ok)throw Error('HTTP '+res.status);
  const data=await res.json();if(Array.isArray(data))setRows(data);
 }catch(e){console.warn('[HOME FILM] 배너 조회 실패:',e.message);}finally{loading=false;}
}
window.addEventListener('homefilm:hero-content',e=>setRows(e.detail));
// Avoid stopping autoplay because of mobile tap/focus. Hover pause is desktop only.
const desktop=matchMedia('(hover:hover) and (pointer:fine)');
root.addEventListener('mouseenter',()=>{if(desktop.matches)hovered=true;});
root.addEventListener('mouseleave',()=>{hovered=false;});
const prev=root.querySelector('.hero-prev'),next=root.querySelector('.hero-next'),toggle=root.querySelector('.hero-toggle');
prev?.addEventListener('click',()=>{if(rows.length>1)display(position-1);});
next?.addEventListener('click',()=>advance());
toggle?.addEventListener('click',()=>{stopped=!stopped;toggle.textContent=stopped?'▶':'Ⅱ';});
fetchRows();setTimeout(fetchRows,1500);setTimeout(fetchRows,6000);
setInterval(()=>{if(!document.hidden&&!stopped&&!hovered)advance();},5000);
// Recheck content if initial fetch raced with deployment/cache, without resetting same list.
setInterval(()=>{if(rows.length<2)fetchRows();},20000);
})();
