HOME FILM STEP06 — GitHub 최신 원본 기반 통합 수정본

1. 변경 내용
- 기존 디자인 A(화이트/베이지)와 섹션 구조 유지
- 온결 필름 -> 홈필름 / HOME FILM 변경
- 상담 폼: 이름, 연락처, 지역, 시공 부위, 내용, 개인정보 동의, Turnstile
- 관리자: 이메일 로그인, 상담 목록 조회, 처리 상태 변경
- 기존 GitHub Pages 도메인 CNAME 유지

2. GitHub 업로드 전 반드시 config.js에서 두 값 입력
- supabasePublishableKey: Supabase의 Publishable key (공개 키만)
- turnstileSiteKey: Cloudflare Turnstile의 Site Key (공개 키만)
- Secret Key, service_role, 데이터베이스 비밀번호를 넣지 마세요.
- 현재 실제 배포된 함수 이름 smooth-processor 사용. 변경된 경우 functionName 수정.

3. GitHub에 업로드하는 방법
- ZIP을 압축 해제
- HOMEFILM_STEP06 폴더 자체가 아니라 안에 있는 파일 7개를 선택
- GitHub interior-film-web 저장소 루트에 업로드
- /index.html 경로가 되어야 합니다. /HOMEFILM_STEP06/index.html이 되면 안 됩니다.
- 기존 루트 CNAME은 반드시 유지합니다.

4. 반드시 확인할 사항
- Supabase Edge Function이 Turnstile 토큰을 실제로 검증하는지 테스트
- 클라이언트는 turnstileToken 필드로 토큰을 보냅니다. 서버 코드의 필드명이 다르면 맞춰야 합니다.
- 실제 접수/관리자 권한은 라이브 환경에서 테스트하지 않았습니다.
- RLS는 admin_users 본인 조회 정책과 inquiries 관리자 조회/수정 정책이 필요합니다.
- 이 버전은 사진 업로드 기능을 제공하지 않습니다. 사진은 추후 Storage 정책과 함께 추가합니다.
- 개인정보처리방침 및 보관 기간을 확정하기 전 실제 고객 정보를 수집하지 마세요.

5. 검증
- ZIP 무결성, HTML 구조 파싱, JS 문법 검사 수행
- Supabase/Cloudflare 실제 연결 테스트는 키가 없어 미실시
