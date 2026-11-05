import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};const $=id=>document.getElementById(id);const msg=$('msg');const items=$('items');
const ok=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.supabaseUrl||'')&&String(cfg.supabasePublishableKey||'').startsWith('sb_publishable_');
if(!ok){msg.textContent='서비스 연결 준비 중입니다.';}else start();
function node(tag,text){const e=document.createElement(tag);if(text!=null)e.textContent=text;return e;}
async function start(){const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);const gallery=location.pathname.endsWith('gallery.html');
async function load(){items.replaceChildren();const {data,error}=await db.from(gallery?'film_gallery':'film_questions').select(gallery?'id,title,category,description,image_path,created_at':'id,author,title,body,answer,created_at').eq('published',true).order('created_at',{ascending:false}).limit(100);if(error){msg.textContent='목록을 불러오지 못했습니다. 서버 설정을 확인해 주세요.';return;}if(!data.length){items.append(node('p','등록된 내용이 없습니다.'));return;}
for(const x of data){const card=node('article');card.className='tile';if(gallery&&x.image_path){const {data:publicUrl}=db.storage.from('film-gallery').getPublicUrl(x.image_path);const img=node('img');img.src=publicUrl.publicUrl;img.alt=x.title;img.loading='lazy';card.append(img);}card.append(node('h2',x.title));card.append(node('p',gallery?(x.category||'시공 사례')+' · '+(x.description||''):x.body));if(!gallery){card.append(node('p','작성자: '+x.author));if(x.answer){card.append(node('strong','관리자 답변'));card.append(node('p',x.answer));}else card.append(node('p','답변 대기 중'));}items.append(card);}}
await load();
const form=$('ask');
if(form){
  const btn=form.querySelector('button[type="submit"]');
  const siteKey=cfg.turnstileSiteKey;
  const widget=$('questionTurnstile');
  let widgetId=null;
  if(!siteKey||!widget){btn.disabled=true;msg.textContent='질문 접수 기능을 준비 중입니다.';return;}
  try {
    await new Promise((resolve,reject)=>{
      if(window.turnstile){resolve();return;}
      const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
      s.onload=resolve;s.onerror=()=>reject(new Error('Turnstile load failed'));document.head.appendChild(s);
    });
    widgetId=window.turnstile.render(widget,{sitekey:siteKey,theme:'light'});
  }catch(_){btn.disabled=true;msg.textContent='보안 인증을 불러오지 못했습니다. 잠시 후 다시 이용해 주세요.';return;}
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const token=window.turnstile.getResponse(widgetId);
    if(!token){msg.textContent='스팸 방지 인증을 완료해 주세요.';return;}
    const f=new FormData(form);
    const values={author:String(f.get('author')||'').trim(),title:String(f.get('title')||'').trim(),body:String(f.get('body')||'').trim(),turnstile_token:token};
    if(!values.author||!values.title||!values.body){msg.textContent='필수 항목을 입력해 주세요.';return;}
    btn.disabled=true;msg.textContent='질문을 접수하고 있습니다...';
    try{
      const response=await fetch(new URL('/functions/v1/submit-question',cfg.supabaseUrl),{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey},body:JSON.stringify(values)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.success!==true)throw new Error('Submission failed');
      form.reset();msg.textContent='질문이 접수되었습니다. 관리자 확인 후 공개됩니다.';
    }catch(_){msg.textContent='질문이 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.';}
    finally{window.turnstile.reset(widgetId);btn.disabled=false;}
  });
}
}
