/* HOME FILM STEP41 - Mobile/desktop hero autoplay reliability.
   Uses existing hero markup and content event. Can independently load public
   published hero rows when the event is missed; never changes database. */
(()=>{'use strict';
const root=document.querySelector('.hero');if(!root)return;
const layers=[root.querySelector('.hero-slide-a'),root.querySelector('.hero-slide-b')];
const heading=root.querySelector('h1'),description=root.querySelector('.hero-content p');
if(layers.some(x=>!x)||!heading||!description)return;
const prev=root.querySelector('.hero-prev'),next=root.querySelector('.hero-next');
const toggle=root.querySelector('.hero-toggle'),count=root.querySelector('.hero-count');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let items=[],index=0,visible=0,sequence=0,paused=false,hovered=false,timer=null;
let fetchAttempts=0,requesting=false;
const valid=r=>r&&r.section==='hero'&&r.published!==false&&/^https:\/\//i.test(String(r.image_url||''));
const sort=(a,b)=>(Number(a.position)||0)-(Number(b.position)||0);
function loadRows(rows){
 const clean=(Array.isArray(rows)?rows:[]).filter(r=>r&&/^https:\/\//i.test(String(r.image_url||''))).sort(sort);
 if(!clean.length)return false;
 const fingerprint=a=>a.map(r=>[r.position,r.image_url,r.title,r.body].join('|')).join('||');
 if(fingerprint(clean)===fingerprint(items))return true;
 items=clean;index=0;render(0,true);
 for(const b of [prev,next,toggle])if(b)b.disabled=items.length<2;
 if(count)count.textContent=`1 / ${items.length}`;
 return true;
}
function render(target,first=false){
 if(!items.length)return;
 const candidate=(target+items.length)%items.length,record=items[candidate];
 const url=String(record.image_url||'');const seq=++sequence;
 const img=new Image();
 img.onload=()=>{
  if(seq!==sequence)return;
  const to=first?visible:1-visible;
  layers[to].style.backgroundImage=`url(${JSON.stringify(url)})`;
  layers[to].classList.add('is-visible');
  layers[1-to].classList.remove('is-visible');
  layers[to].style.transitionDuration=reduced.matches?'0s':'';
  visible=to;index=candidate;
  heading.textContent=record.title||'';description.textContent=record.body||'';
  if(count)count.textContent=`${index+1} / ${items.length}`;
  root.classList.add('hero-rotation-ready');
 };
 img.onerror=()=>{
  if(seq!==sequence)return;
  console.warn('[HOME FILM] 배너 이미지 불러오기 실패:',url);
  if(items.length>1){window.setTimeout(()=>{if(seq===sequence)render(candidate+1);},300);}
 };
 img.src=url;
}
function advance(delta){if(items.length>1)render(index+delta);}
function startTimer(){if(timer)clearInterval(timer);timer=window.setInterval(()=>{
 if(!paused&&!hovered&&!document.hidden&&items.length>1)advance(1);
},5000);}
function fetchRows(){
 if(requesting||items.length>1||fetchAttempts>=4)return;
 const cfg=window.HOMEFILM_CONFIG||{};
 const base=String(cfg.supabaseUrl||'').replace(/\/$/,'');
 const key=String(cfg.supabasePublishableKey||'');
 if(!/^https:\/\//i.test(base)||!key)return;
 requesting=true;fetchAttempts++;
 fetch(base+'/rest/v1/home_content?select=section,position,title,body,image_url,published&section=eq.hero&published=eq.true&order=position.asc',{
  headers:{apikey:key,Authorization:'Bearer '+key},cache:'no-store'
 }).then(async res=>{if(!res.ok)throw Error('HTTP '+res.status);return res.json();})
 .then(rows=>{if(Array.isArray(rows))loadRows(rows);})
 .catch(err=>console.warn('[HOME FILM] 배너 목록 조회:',err.message))
 .finally(()=>{requesting=false;});
}
window.addEventListener('homefilm:hero-content',e=>loadRows(e.detail));
if(prev)prev.addEventListener('click',()=>advance(-1));
if(next)next.addEventListener('click',()=>advance(1));
if(toggle)toggle.addEventListener('click',()=>{
 paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';
 toggle.setAttribute('aria-label',paused?'자동 재생 시작':'자동 재생 일시정지');
});
const mouse=window.matchMedia('(hover: hover) and (pointer: fine)');
root.addEventListener('mouseenter',()=>{if(mouse.matches)hovered=true;});
root.addEventListener('mouseleave',()=>{hovered=false;});
root.addEventListener('focusin',e=>{if(mouse.matches&&e.target.closest('.hero-controls'))hovered=true;});
root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget))hovered=false;});
for(const b of [prev,next,toggle])if(b)b.disabled=true;
startTimer();
// The content event may have fired before this file loaded; recover independently.
window.setTimeout(fetchRows,800);
window.setTimeout(fetchRows,3500);
window.setTimeout(fetchRows,8000);
window.setTimeout(fetchRows,14000);
})();
