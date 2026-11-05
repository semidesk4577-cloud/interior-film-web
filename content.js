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
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),15000);
      let response;
      try{
        response=await fetch(new URL('/functions/v1/submit-question',cfg.supabaseUrl),{
          method:'POST',
          headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey},
          body:JSON.stringify(values),signal:controller.signal
        });
      }finally{clearTimeout(timeout);}
      const result=await response.json().catch(()=>({}));
      if(!response.ok||result.success!==true){
        const reason=typeof result.error==='string'?result.error:'';
        let detail='서버 처리 오류';
        if(response.status===401)detail='함수 JWT 인증 설정 확인 필요';
        else if(response.status===403)detail='Turnstile 또는 접속 도메인 인증 실패';
        else if(response.status===404)detail='submit-question 함수 주소 또는 배포 상태 확인 필요';
        else if(response.status===400)detail='질문 입력값 검증 실패';
        else if(response.status===503)detail='서버 환경변수 또는 인증 서비스 연결 확인 필요';
        else if(response.status===500)detail='서버 저장 처리 실패 (함수 로그 확인 필요)';
        throw new Error(detail+' · HTTP '+response.status+(reason?' · '+reason:''));
      }
      form.reset();msg.textContent='질문이 접수되었습니다. 관리자 확인 후 공개됩니다.';
    }catch(err){
      const detail=err?.name==='AbortError'?'서버 응답 시간 초과':err instanceof TypeError?'서버 연결 또는 CORS 오류':String(err?.message||'알 수 없는 오류');
      msg.textContent='질문 접수 실패: '+detail+'\n질문 내용은 유지됩니다. 원인 확인 전 반복 제출하지 마세요.';
      console.error('HOME FILM question submit:',err);
    }
    finally{try{window.turnstile.reset(widgetId);}catch(_){}btn.disabled=false;}
  });
}
}
