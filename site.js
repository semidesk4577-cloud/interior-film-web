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
  const configured = [cfg.supabaseUrl, cfg.supabasePublishableKey, cfg.turnstileSiteKey].every(x => typeof x === 'string' && x && !x.startsWith('PASTE_'));
  if (!configured) { status.textContent = '상담 기능 연결 준비 중입니다. 잠시 후 다시 이용해 주세요.'; return; }
  const host = new URL(cfg.supabaseUrl).origin;
  let widgetId = null;
  window.onHomefilmTurnstileReady = () => {
    if (!window.turnstile) return;
    widgetId = window.turnstile.render('#turnstileWidget', {sitekey:cfg.turnstileSiteKey, theme:'light', callback:()=>{btn.disabled=false;}, 'expired-callback':()=>{btn.disabled=true;}});
    notice.textContent = '스팸 방지 인증 후 상담을 신청할 수 있습니다.';
  };
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onHomefilmTurnstileReady&render=explicit';
  script.async=true;script.defer=true;document.head.appendChild(script);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const token = window.turnstile?.getResponse(widgetId);
    if (!token) {status.textContent='스팸 방지 인증을 완료해 주세요.';return;}
    btn.disabled=true;status.textContent='상담 신청을 접수하고 있습니다...';
    const payload = {customer_name:document.getElementById("name").value.trim(), phone:document.getElementById("phone").value.trim(), location:document.getElementById("region").value.trim(), service_type:document.getElementById("service_type").value, message:document.getElementById("details").value.trim(), turnstile_token:token};
    try {
      const response=await fetch(`${host}/functions/v1/${encodeURIComponent(cfg.functionName)}`,{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.supabasePublishableKey},body:JSON.stringify(payload)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok || result.success!==true) throw new Error((result.error || '접수 처리에 실패했습니다.') + ' (HTTP ' + response.status + ')');
      form.reset();status.textContent='상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.';
    } catch(err) {status.textContent='접수 실패: '+String(err.message||'네트워크 연결을 확인해 주세요.');console.error('HOME FILM inquiry:',err);}
    finally {window.turnstile?.reset(widgetId);btn.disabled=true;}
  });
})();
