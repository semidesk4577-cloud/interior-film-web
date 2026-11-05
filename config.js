// 공개 브라우저 설정: Secret/service_role 키는 절대 입력하지 마세요.
// 두 공개 키를 채우면 상담 신청과 관리자 로그인 UI가 활성화됩니다.
window.HOMEFILM_CONFIG = Object.freeze({
  supabaseUrl: "https://ahwpjqtlcnvvkrrhpctl.supabase.co",
  supabasePublishableKey: "PASTE_SUPABASE_PUBLISHABLE_KEY_HERE",
  turnstileSiteKey: "PASTE_CLOUDFLARE_TURNSTILE_SITE_KEY_HERE",
  functionName: "smooth-processor" // 현재 실제 배포된 함수 이름
});
