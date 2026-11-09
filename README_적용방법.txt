HOME FILM Railway API 접수 전환 (기존 디자인/관리자/갤러리 유지)

GitHub interior-film-web 저장소의 최상위에 site.js 와 content.js 두 파일만 덮어쓰기 업로드 후 Commit.
site.js: 메인 상담 접수 -> Railway POST /api/intake
content.js: 질문 접수 -> Railway POST /api/intake; 기존 Supabase 공개 질문 목록/갤러리 조회 유지

주의: Railway 서버는 기존 Cloudflare Turnstile sitekey와 secret이 같은 위젯의 쌍이어야 합니다. 운영 접수 성공은 배포 후 실제 테스트 필요.
질문 목록은 여전히 Supabase film_questions를 읽으므로 새 MySQL 질문은 기존 공개 목록에 자동 표시되지 않습니다. 관리자 신규 MySQL 관리 화면도 아직 미구현입니다.
운영 반영 전 백업 권장. 문제 발생 시 두 JS 파일을 이전 버전으로 되돌리세요.
