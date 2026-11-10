/* HOME FILM STEP37: service carousel automatic LEFT-to-RIGHT roll.
   Original service cards remain the only source of content; clones are visual only.
   Supports new cards from home-content.js without changing the admin or database. */
(()=>{'use strict';
const track=document.getElementById('serviceTrack');
const wrap=document.querySelector('.service-carousel');
if(!track||!wrap)return;
const prev=wrap.querySelector('.service-prev'),next=wrap.querySelector('.service-next');
const hint=document.getElementById('serviceHint');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let originals=[],groupWidth=0,paused=false,locked=false;
const gap=()=>parseFloat(getComputedStyle(track).gap)||0;
const unit=()=>{const card=track.querySelector('.service-card:not([data-service-copy])');return card?card.getBoundingClientRect().width+gap():0;};
const observer=new MutationObserver(()=>rebuild());
function clone(card){const e=card.cloneNode(true);e.dataset.serviceCopy='1';e.setAttribute('aria-hidden','true');e.setAttribute('inert','');return e;}
function rebuild(){
 observer.disconnect();
 track.querySelectorAll('[data-service-copy]').forEach(e=>e.remove());
 originals=Array.from(track.children).filter(e=>e.classList.contains('service-card'));
 if(originals.length){
  const before=document.createDocumentFragment(),after=document.createDocumentFragment();
  for(const card of originals){before.append(clone(card));after.append(clone(card));}
  track.prepend(before);track.append(after);
  groupWidth=unit()*originals.length;
  track.scrollLeft=groupWidth;
 }else{groupWidth=0;}
 prev.disabled=next.disabled=originals.length<2;
 if(hint)hint.textContent=originals.length+'개 시공 항목 · 자동으로 왼쪽에서 오른쪽으로 이동 · 화살표로 수동 이동';
 observer.observe(track,{childList:true});
}
function normalize(){
 if(!groupWidth)return;
 if(track.scrollLeft>=groupWidth*2-1)track.scrollLeft-=groupWidth;
 else if(track.scrollLeft<groupWidth-1)track.scrollLeft+=groupWidth;
}
function move(dir){
 if(locked||originals.length<2)return;
 locked=true;
 track.scrollBy({left:unit()*dir,behavior:reduced.matches?'instant':'smooth'});
 window.setTimeout(()=>{normalize();locked=false;},reduced.matches?20:650);
}
prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
track.addEventListener('scroll',()=>{if(!locked)normalize();},{passive:true});
wrap.addEventListener('mouseenter',()=>{paused=true;});
wrap.addEventListener('mouseleave',()=>{paused=false;});
wrap.addEventListener('focusin',()=>{paused=true;});
wrap.addEventListener('focusout',e=>{if(!wrap.contains(e.relatedTarget))paused=false;});
window.addEventListener('resize',()=>rebuild());
rebuild();
window.setInterval(()=>{if(!paused&&!document.hidden&&!reduced.matches)move(-1);},3500);
})();
