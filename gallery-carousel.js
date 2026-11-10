/* HOME FILM STEP36: gallery auto-carousel with arrow controls.
 * The database renderer owns the original .work-card elements.
 * Duplicate cards are presentation-only; never saved to Supabase.
 */
(()=>{'use strict';
const track=document.getElementById('sampleWorks');
const wrapper=document.querySelector('.gallery-carousel');
if(!track||!wrapper)return;
const prev=wrapper.querySelector('.gallery-prev'),next=wrapper.querySelector('.gallery-next');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let originals=[],groupWidth=0,paused=false,locked=false,animation=null,ignoreMutations=false;
const gap=()=>parseFloat(getComputedStyle(track).gap)||0;
const unit=()=>{const card=track.querySelector('.work-card:not([data-gallery-copy])');return card?card.getBoundingClientRect().width+gap():0;};
function restore(){track.querySelectorAll('[data-gallery-copy]').forEach(e=>e.remove());}
function clone(card){const node=card.cloneNode(true);node.dataset.galleryCopy='1';node.setAttribute('aria-hidden','true');node.setAttribute('inert','');return node;}
function rebuild(){
 if(ignoreMutations)return;
 ignoreMutations=true;observer.disconnect();
 restore();originals=Array.from(track.children).filter(e=>e.classList.contains('work-card'));
 if(!originals.length){prev.disabled=next.disabled=true;ignoreMutations=false;observer.observe(track,{childList:true});return;}
 const before=document.createDocumentFragment(),after=document.createDocumentFragment();
 for(const card of originals){before.append(clone(card));after.append(clone(card));}
 track.prepend(before);track.append(after);
 groupWidth=unit()*originals.length;
 track.scrollLeft=groupWidth;
 prev.disabled=next.disabled=originals.length<2;
 ignoreMutations=false;observer.observe(track,{childList:true});
}
const observer=new MutationObserver(()=>rebuild());
function normalize(){
 if(!groupWidth)return;
 if(track.scrollLeft>=groupWidth*2-1)track.scrollLeft-=groupWidth;
 else if(track.scrollLeft<groupWidth-1)track.scrollLeft+=groupWidth;
}
function move(dir){
 if(locked||originals.length<2)return;
 locked=true;
 const delta=unit()*dir;
 // Increment one card; wrap seamlessly within cloned content.
 track.scrollBy({left:delta,behavior:reduced.matches?'instant':'smooth'});
 window.setTimeout(()=>{normalize();locked=false;},reduced.matches?20:650);
}
track.addEventListener('scroll',()=>{if(!locked)normalize();},{passive:true});
prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
wrapper.addEventListener('mouseenter',()=>{paused=true;});
wrapper.addEventListener('mouseleave',()=>{paused=false;});
wrapper.addEventListener('focusin',()=>{paused=true;});
wrapper.addEventListener('focusout',e=>{if(!wrapper.contains(e.relatedTarget))paused=false;});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)normalize();});
window.addEventListener('resize',()=>rebuild());
const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
mq.addEventListener?.('change',()=>{if(mq.matches)normalize();});
rebuild();
animation=window.setInterval(()=>{if(!paused&&!document.hidden&&!reduced.matches)move(1);},3500);
})();
