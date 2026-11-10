
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const cfg=window.HOMEFILM_CONFIG||{},$=id=>document.getElementById(id),say=t=>$('msg').textContent=t;
const db=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
let rows=[],current=null;
const sections={hero:'메인 배너',about:'브랜드 소개',service:'시공 서비스',work:'시공 갤러리'};
const imgOk=u=>!u||(/^https:\/\//.test(u)&&u.length<=1500);
async function load(){
 const {data,error}=await db.from('home_content').select('*').order('position',{ascending:true}).limit(200);
 if(error)throw new Error('콘텐츠 테이블 조회 실패. SETUP_HOME_CONTENT.sql 적용 및 관리자 권한을 확인하세요. ('+error.message+')');
 rows=data||[];render();
}
function render(){
 const section=$('section').value,list=rows.filter(r=>r.section===section).sort((a,b)=>a.position-b.position);
 $('entry').replaceChildren(new Option('새 항목',''));
 for(const r of list)$('entry').add(new Option(`${r.position}. ${r.title||'(제목 없음)'}`,r.id));
 $('entry').value=current&&list.some(r=>r.id===current)?current:'';
 const box=$('items');box.replaceChildren();
 for(const r of list){
  const card=document.createElement('div');card.className='entry';
  const head=document.createElement('div');head.className='entry-head';
  if(r.image_url){const img=document.createElement('img');img.src=r.image_url;img.alt=r.title||'이미지';img.loading='lazy';head.append(img);}
  const text=document.createElement('strong');text.textContent=`${r.position}. ${r.title||'(제목 없음)'}`;head.append(text);
  const state=document.createElement('span');state.className='tag';state.textContent=r.published?'공개':'비공개';head.append(state);
  const button=document.createElement('button');button.type='button';button.textContent='수정';button.addEventListener('click',()=>{current=r.id;fill();$('editor').scrollIntoView({behavior:'smooth'});});head.append(button);card.append(head);box.append(card);
 }
 fill();
}
function fill(){
 const r=rows.find(x=>x.id===current);
 $('entry').value=r?.id||'';
 $('title').value=r?.title||'';
 $('body').value=r?.body||'';
 $('imageUrl').value=r?.image_url||'';
 $('position').value=r?.position||1;
 $('published').checked=r?.published??true;
 $('imageFile').value='';
 $('remove').disabled=!r;
}
$('section').addEventListener('change',()=>{current=null;render();});
$('entry').addEventListener('change',()=>{current=$('entry').value||null;fill();});
$('new').addEventListener('click',()=>{current=null;fill();});
$('reload').addEventListener('click',async()=>{try{await load();say('목록을 새로고침했습니다.');}catch(e){say(e.message);}});
$('remove').addEventListener('click',async()=>{
 if(!current||!confirm('선택한 콘텐츠를 삭제하시겠습니까?'))return;
 const {error}=await db.from('home_content').delete().eq('id',current);
 if(error)return say('삭제 실패: '+error.message);
 current=null;await load();say('삭제되었습니다.');
});
$('form').addEventListener('submit',async e=>{
 e.preventDefault();
 const btn=$('save');btn.disabled=true;
 try{
  const section=$('section').value;
  if(section==='about'&&!current&&rows.some(r=>r.section==='about'))throw Error('브랜드 소개는 1개만 등록할 수 있습니다. 기존 항목을 선택해 수정하세요.');
  let image_url=$('imageUrl').value.trim();
  if(!imgOk(image_url))throw Error('이미지 주소는 https:// 로 시작해야 합니다.');
  const file=$('imageFile').files[0];
  if(file){
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('JPEG/PNG/WEBP 5MB 이하만 업로드할 수 있습니다.');
   const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
   const path='home-content/'+crypto.randomUUID()+'.'+ext;
   const {error}=await db.storage.from('film-gallery').upload(path,file,{contentType:file.type,upsert:false});
   if(error)throw Error('이미지 업로드 실패: '+error.message);
   image_url=db.storage.from('film-gallery').getPublicUrl(path).data.publicUrl;
  }
  const payload={section,position:Number($('position').value),title:$('title').value.trim(),body:$('body').value.trim(),image_url:image_url||null,published:$('published').checked};
  if(!payload.title||payload.position<1||payload.position>999)throw Error('제목과 표시 순서를 확인하세요.');
  const query=current?db.from('home_content').update(payload).eq('id',current):db.from('home_content').insert(payload);
  const {error}=await query;if(error)throw Error('저장 실패: '+error.message);
  current=null;await load();say('저장되었습니다. 홈페이지에서 새로고침하여 확인하세요.');
 }catch(err){say(err.message);}finally{btn.disabled=false;}
});
async function init(){
 try{
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user)throw Error('관리자 로그인이 필요합니다. 관리자 홈에서 로그인해 주세요.');
  const {data:admin,error:ae}=await db.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
  if(ae||!admin)throw Error('관리자 권한이 없습니다.');
  $('manager').hidden=false;await load();say('관리자 인증 완료. 콘텐츠를 선택해 수정하세요.');
 }catch(e){say(e.message);}
}
init();
