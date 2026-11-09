(() => {
  'use strict';
  // Use the canonical hostname required by the deployed Edge Function.
  if (location.hostname === 'homefilm.co.kr') {
    location.replace('https://www.homefilm.co.kr' + location.pathname + location.search + location.hash);
    return;
  }
  const cfg = window.HOMEFILM_CONFIG || {};
  const form = document.getElementById('contactForm');
  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');
  const notice = document.getElementById('setupNotice');
  const configured = [cfg.turnstileSiteKey].every(x => typeof x === 'string' && x && !x.startsWith('PASTE_'));
  if (!configured) { status.textContent = '상담 기능 연결 준비 중입니다. 잠시 후 다시 이용해 주세요.'; return; }
  // Dedicated Railway intake API; existing gallery/admin remain unchanged.
  const intakeUrl = 'https://homefilm-api-production.up.railway.app/api/intake';
  let widgetId = null;
  let submitting = false;
  const originalButtonText = btn.textContent;
  window.onHomefilmTurnstileReady = () => {
    if (!window.turnstile) return;
    widgetId = window.turnstile.render('#turnstileWidget', {sitekey:cfg.turnstileSiteKey, theme:'light', callback:()=>{if(!submitting)btn.disabled=false;}, 'expired-callback':()=>{btn.disabled=true;status.textContent='인증 시간이 만료되었습니다. 다시 인증해 주세요.';}, 'error-callback':()=>{btn.disabled=true;status.textContent='스팸 방지 인증을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';}});
    notice.textContent = '스팸 방지 인증 후 상담을 신청할 수 있습니다.';
  };
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onHomefilmTurnstileReady&render=explicit';
  script.async=true;script.defer=true;document.head.appendChild(script);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if(submitting)return;
    if(!form.reportValidity())return;
    const token = window.turnstile?.getResponse(widgetId);
    if (!token) {status.textContent='스팸 방지 인증을 완료해 주세요.';return;}
    const phoneInput=document.getElementById('phone');
    const digits=phoneInput.value.replace(/[^0-9]/g,'');
    if(digits.length<9||digits.length>11){status.textContent='연락처를 확인해 주세요. 숫자 9~11자리로 입력해야 합니다.';phoneInput.focus();return;}
    submitting=true;btn.disabled=true;btn.textContent='접수 중...';status.textContent='상담 신청을 접수하고 있습니다...';
    const region=document.getElementById('region').value.trim();
    const service=document.getElementById('service_type').value.trim();
    const details=document.getElementById('details').value.trim();
    const payload={type:'consultation',author:document.getElementById('name').value.trim(),phone:document.getElementById('phone').value.trim(),body:`시공 지역: ${region}\n시공 종류: ${service}\n문의 내용: ${details}`,turnstile_token:token};
    try {
      const response=await fetch(intakeUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok || result.ok!==true) throw new Error((result.code || '접수 처리에 실패했습니다.') + ' (HTTP ' + response.status + ')');
      form.reset();
      const receipt=typeof result.receipt==='string'?result.receipt:'';
      status.textContent='상담 신청이 정상 접수되었습니다. 확인 후 연락드리겠습니다.'+(receipt?'\n접수번호: '+receipt:'');
      status.style.whiteSpace='pre-line';
    } catch(err) {status.textContent='접수 실패: '+String(err.message||'네트워크 연결을 확인해 주세요.');console.error('HOME FILM inquiry:',err);}
    finally {submitting=false;btn.textContent=originalButtonText;window.turnstile?.reset(widgetId);btn.disabled=true;}
  });
})();
