HOME FILM STEP15 - 시공 갤러리 / 고객 질문 기능 준비본

기존 홈페이지·관리자 파일을 덮어쓰지 않습니다.
추가 파일: gallery.html, questions.html, content.js, content-admin.html, content-admin.js
SQL: SETUP_ONCE.sql (GitHub에 절대 업로드하지 마세요).

현재는 소스 준비 단계입니다. SQL을 Supabase에서 1회 실행하고 관리자 로그인을 복구해야 실제 저장 테스트가 가능합니다.
질문은 기본적으로 비공개이며 관리자가 승인해야 공개됩니다.
운영 전 고객 질문 스팸 방지(서버 측 Turnstile 검증/요청 제한) 추가가 필요합니다.
갤러리 삭제는 DB 레코드만 삭제합니다. 저장소 이미지 정리는 별도 작업이 필요합니다.
