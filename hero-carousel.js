/* STEP38 HOME FILM hero rotation. The database provides hero items.
 * Existing banner stays as a fallback when the database is unavailable.
 */
(()=>{'use strict';
const root=document.querySelector('.hero');
if(!root)return;
const layers=[root.querySelector('.hero-slide-a'),root.querySelector('.hero-slide-b')];
const title=root.querySelector('h1'),body=root.querySelector('.hero-content p');
const prev=root.querySelector('.hero-prev'),next=root.querySelector('.hero-next');
const toggle=root.querySelector('.hero-toggle'),count=root.querySelector('.hero-count');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let items=[],idx=0,active=0,paused=false,timer=null,initialized=false;
function show(i,first=false){
 if(!items.length)return;
 idx=(i+items.length)%items.length;
 const item=items[idx];
 const layer=layers[first?0:1-active];
 const url=String(item.image_url||'');
 if(!/^https:\/\//.test(url))return;
 const img=new Image();
 img.onload=()=>{
  layer.style.backgroundImage=`url("${url.replace(/["\\]/g,'')}")`;
  layer.classList.add('is-visible');
  if(!first)layers[active].classList.remove('is-visible');
  active=first?0:1-active;
  title.textContent=item.title||'';
  body.textContent=item.body||'';
  count.textContent=`${idx+1} / ${items.length}`;
  root.classList.add('hero-rotation-ready');
 };
 img.onerror=()=>{console.warn('HOME FILM: hero image unavailable',url);};
 img.src=url;
}
function advance(dir){if(items.length>1)show(idx+dir);}
function start(){if(timer)clearInterval(timer);timer=setInterval(()=>{if(!paused&&!document.hidden&&!reduced.matches)advance(1);},5000);}
prev.addEventListener('click',()=>advance(-1));
next.addEventListener('click',()=>advance(1));
toggle.addEventListener('click',()=>{paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';toggle.setAttribute('aria-label',paused?'자동 재생 시작':'자동 재생 일시정지');});
root.addEventListener('mouseenter',()=>{paused=true;});
root.addEventListener('mouseleave',()=>{paused=false;});
root.addEventListener('focusin',()=>{paused=true;});
root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))paused=false;});
window.addEventListener('homefilm:hero-content',e=>{
 const list=(e.detail||[]).filter(x=>/^https:\/\//.test(x.image_url||''));
 if(!list.length)return;
 items=list;idx=0;show(0,true);
 prev.disabled=next.disabled=items.length<2;
 toggle.disabled=items.length<2;
 if(!initialized){start();initialized=true;}
});
prev.disabled=next.disabled=toggle.disabled=true;
})();
