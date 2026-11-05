HOME FILM STEP14 - 관리자 인증 링크 통합 보완

교체 파일: index.html, admin.js (GitHub 저장소 최상위 경로)
기존 admin.html, config.js, site.js 및 CNAME은 수정하지 않습니다.

수정:
- Supabase 이메일 링크가 홈페이지 루트로 들어와도 관리자 페이지로 전달
- access_token/refresh_token 해시, PKCE code, token_hash, 만료/오류 링크 처리
- 성공 시 URL의 인증 정보 제거, 비밀번호 복구 화면, 관리자 대시보드 연결
- 기존 관리자 로그인 디자인/상담 화면 유지

주의:
1) 이미 노출된 인증 링크는 다시 사용하지 말고 새 링크를 발급받으세요.
2) Supabase Auth URL Configuration의 Site URL과 Redirect URLs도 별도 확인이 필요할 수 있습니다.
3) 이 파일은 정적 코드 검사 완료; 실제 Supabase 이메일/관리자 권한/상담 저장 테스트는 미완료입니다.
4) 이전에 채팅에 노출된 Supabase Secret Key는 폐기하세요.
