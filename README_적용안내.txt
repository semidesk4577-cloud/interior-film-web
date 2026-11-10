HOME FILM 회원 인증 STEP01 - 독립 화면 / 기존 파일 변경 없음

파일: signup.html, login.html, mypage.html, member.js, member.css

1. 다섯 파일을 GitHub 저장소 최상위에 업로드합니다. 기존 index.html, 관리자, 배너 관련 파일은 수정하지 않습니다.
2. 기존 config.js가 있어야 합니다. 이 ZIP에는 공개 키를 포함하지 않았습니다.
3. Supabase Authentication > Providers > Email에서 이메일 가입 및 확인 정책을 확인합니다.
4. Supabase Authentication > URL Configuration에서 Site URL=https://www.homefilm.co.kr 및 Redirect URLs에 https://www.homefilm.co.kr/login.html, https://www.homefilm.co.kr/mypage.html 을 등록합니다. 비-www 도메인에서 사용할 경우 해당 URL도 등록합니다.
5. https://www.homefilm.co.kr/signup.html 에서 테스트 회원으로 가입·이메일 확인·로그인·로그아웃을 검증합니다.
6. 기존 견적 문의는 아직 회원 전용으로 변경하지 않았습니다. Railway API 인증 검증과 DB 회원 소유권 정책을 별도 구현 후 연결해야 합니다.
7. 현재 mypage.html은 로그인 상태 확인만 수행합니다. 상담 이력 기능은 미구현입니다.
8. 실제 운영 전에 개인정보처리방침, 회원 탈퇴/삭제 정책, 비밀번호 복구 완성 및 이메일 템플릿을 점검하세요.

주의: 이메일 인증 및 비밀번호 재설정은 Supabase Auth 설정에 의존합니다. 재설정 링크로 이동한 뒤 새 비밀번호를 입력하는 화면은 후속 단계에서 구현해야 합니다.
