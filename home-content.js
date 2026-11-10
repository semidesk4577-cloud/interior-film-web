
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
if(cfg.supabaseUrl&&cfg.supabasePublishableKey){
const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const $=s=>document.querySelector(s);
const apply=(node,text)=>{if(node&&typeof text==='string')node.textContent=text;};
const photo=(node,url)=>{if(node&&/^https:\/\//.test(url||''))node.style.backgroundImage=`url("${url.replace(/["\\]/g,'')}")`;};
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
try{
const {data,error}=await db.from('home_content').select('section,position,title,body,image_url').eq('published',true).order('position',{ascending:true});
if(error)throw error;
const rows=data||[];
window.HOMEFILM_CONTENT_ROWS=rows;
window.dispatchEvent(new CustomEvent('homefilm:content-ready',{detail:rows}));
const single=(key)=>rows.find(r=>r.section===key);
let x=single('hero');if(x){
 const heroRows=rows.filter(r=>r.section==='hero').sort((a,b)=>a.position-b.position);
 window.dispatchEvent(new CustomEvent('homefilm:hero-content',{detail:heroRows}));
 // The hero-carousel script owns banner text and image transitions.
}
x=single('about');if(x){apply($('.about h2'),x.title);apply($('.about p'),x.body);photo($('.about-image'),x.image_url);}
const cards=(section,track,cls,headerTag)=>{
 const found=rows.filter(r=>r.section===section);
 if(!found.length||!track)return;
 track.replaceChildren();
 for(const r of found){const card=el('article',cls);const img=el('div','photo');img.setAttribute('role','img');img.setAttribute('aria-label',r.title||'시공 사진');photo(img,r.image_url);
 const copy=el('div','copy');copy.append(el(headerTag,'',r.title||''),el('p','',r.body||''));card.append(img,copy);track.append(card);}
};
cards('service',$('#serviceTrack'),'service-card','h3');
cards('work',$('#sampleWorks'),'work-card','strong');
if(rows.some(r=>r.section==='work')){const n=$('#sampleNotice');if(n)n.textContent='※ 사진과 설명은 등록된 콘텐츠를 기준으로 표시됩니다.';}
}catch(e){window.HOMEFILM_CONTENT_ERROR=String(e.message||e);window.dispatchEvent(new CustomEvent('homefilm:content-error',{detail:window.HOMEFILM_CONTENT_ERROR}));console.warn('HOME FILM content: existing content preserved',e.message);}
}
