import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{};
const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
const api='https://homefilm-api-production.up.railway.app';
const list=document.getElementById('myQuestions'),status=document.getElementById('questionStatus');
const say=s=>status.textContent=s;
function itemView(q){
 const article=document.createElement('article');article.className='q-item';
 const h=document.createElement('h3');h.textContent=q.title||'견적 문의';article.append(h);
 const meta=document.createElement('p');meta.className='q-meta';
 const state={new:'접수',in_progress:'처리 중',closed:'완료'}[q.status]||'접수';
 meta.textContent=state+' · '+(q.created_at?new Date(q.created_at).toLocaleDateString('ko-KR'):'');article.append(meta);
 const body=document.createElement('p');body.textContent=q.body||'';article.append(body);
 if(q.answer){const answer=document.createElement('div');answer.className='q-answer';answer.textContent='관리자 답변: '+q.answer;article.append(answer);}
 return article;
}
async function load(){
 try{
  const {data,error}=await db.auth.getSession();if(error)throw error;
  if(!data.session){location.replace('login.html');return;}
  const response=await fetch(api+'/api/member/questions',{headers:{Authorization:'Bearer '+data.session.access_token},cache:'no-store'});
  if(!response.ok)throw Error('조회 실패 (HTTP '+response.status+')');
  const json=await response.json();if(!json.ok)throw Error('조회 결과 오류');
  list.replaceChildren();
  const items=json.items||[];if(!items.length){say('이 계정으로 접수한 질문이 아직 없습니다. 기존 비회원 질문은 자동 연결되지 않습니다.');return;}
  say('내 질문 '+items.length+'건');items.forEach(q=>list.append(itemView(q)));
 }catch(e){say('상담 내역을 불러오지 못했습니다. Railway API 배포와 DB 변경을 확인해 주세요. '+e.message);}
}
load();
