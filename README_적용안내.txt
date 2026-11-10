HOME FILM 회원 관리: Supabase 대시보드 대신 관리자 페이지에서 회원 목록 조회

1. GitHub 저장소 루트: admin-members.html, admin-members.js, admin-intakes.html 업로드.
2. Railway API 프로젝트의 api/src/server.js 를 동봉 파일로 교체 후 배포. 반드시 현재 Railway 소스와 비교하여 기존 신규 기능을 보존하세요. 이 서버 파일은 사용자가 제공한 2026-11-10 전체 ZIP 기준입니다.
3. Railway 환경변수 SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_EMAIL(기존값) 외에 SUPABASE_SERVICE_ROLE_KEY를 추가. 서비스 역할 키는 Railway 서버 환경변수에만 저장하고 GitHub/브라우저에 절대 업로드하지 마세요.
4. 기존 관리자 계정으로 로그인 후 admin-intakes.html > 회원 관리 선택.

보안: 기존 API adminAuth가 인증된 관리자 이메일을 검증한 뒤에만 회원 목록을 반환합니다. 회원 삭제/비밀번호 변경 기능은 제공하지 않습니다.
주의: 현재 운영 Railway 서버 파일이 업로드된 ZIP보다 최신일 수 있으므로 전체 덮어쓰기 전에 비교가 필요합니다. 서버에 실제 배포/연동 검증은 하지 않았습니다.
