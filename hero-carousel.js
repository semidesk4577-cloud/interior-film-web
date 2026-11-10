/* HOME FILM STEP40: robust desktop/mobile hero autoplay.
 * No changes to layout, admin, database, or hidden controls.
 */
(()=>{'use strict';
const root=document.querySelector('.hero');if(!root)return;
const layers=[root.querySelector('.hero-slide-a'),root.querySelector('.hero-slide-b')];
const title=root.querySelector('h1'),body=root.querySelector('.hero-content p');
const prev=root.querySelector('.hero-prev'),next=root.querySelector('.hero-next');
const toggle=root.querySelector('.hero-toggle'),count=root.querySelector('.hero-count');
if(layers.some(x=>!x)||!title||!body||!prev||!next||!toggle||!count)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let items=[],idx=0,active=0,paused=false,hovered=false,focused=false,timer=null,serial=0;
function show(i,first=false){
 if(!items.length)return;
 const newIndex=(i+items.length)%items.length;
 const item=items[newIndex],url=String(item.image_url||'');
 if(!/^https:\/\//i.test(url))return;
 const token=++serial,img=new Image();
 img.onload=()=>{
  if(token!==serial)return;
  const newActive=first?0:1-active,layer=layers[newActive];
  layer.style.backgroundImage=`url("${url.replace(/["\\]/g,'')}")`;
  layer.classList.add('is-visible');
  if(!first)layers[active].classList.remove('is-visible');
  active=newActive;idx=newIndex;
  title.textContent=item.title||'';body.textContent=item.body||'';
  count.textContent=`${idx+1} / ${items.length}`;
  root.classList.add('hero-rotation-ready');
 };
 img.onerror=()=>console.warn('HOME FILM: hero image failed',url);
 img.src=url;
}
function advance(dir){if(items.length>1)show(idx+dir);}
function restart(){if(timer)clearInterval(timer);timer=setInterval(()=>{
 // On touch devices, a tapped link may keep focus indefinitely.
 // Pause for hover/focus only on true mouse/keyboard devices.
 if(!paused&&!hovered&&!focused&&!document.hidden)advance(1);
},5000);}
prev.addEventListener('click',()=>advance(-1));next.addEventListener('click',()=>advance(1));
toggle.addEventListener('click',()=>{
 paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';
 toggle.setAttribute('aria-label',paused?'자동 재생 시작':'자동 재생 일시정지');
});
const mouseOnly=window.matchMedia('(hover: hover) and (pointer: fine)');
root.addEventListener('mouseenter',()=>{if(mouseOnly.matches)hovered=true;});
root.addEventListener('mouseleave',()=>{hovered=false;});
root.addEventListener('focusin',e=>{if(mouseOnly.matches&&e.target.closest('.hero-controls'))focused=true;});
root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))focused=false;});
window.addEventListener('homefilm:hero-content',e=>{
 const list=(e.detail||[]).filter(x=>/^https:\/\//i.test(x.image_url||''));
 if(!list.length)return;
 items=list;show(0,true);
 prev.disabled=next.disabled=toggle.disabled=items.length<2;
 restart();
});
// Respect reduced motion by removing cross-fade animation, not by freezing banners.
function motion(){for(const layer of layers)layer.style.transitionDuration=reduced.matches?'0s':'';}
motion();if(reduced.addEventListener)reduced.addEventListener('change',motion);
prev.disabled=next.disabled=toggle.disabled=true;
})();
