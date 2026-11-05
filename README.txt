HOME FILM STEP18: 질문 접수 오류 구분 패치
1. GitHub 저장소 루트 content.js 한 파일만 덮어쓰기 후 Commit.
2. questions.html 에서 질문 1회 제출.
3. 표시되는 HTTP 코드와 메시지를 확인해 원인별로 후속 조치.
기존 데이터베이스/관리자/갤러리/상담 접수 코드는 변경하지 않음.
실제 Supabase 호출은 로컬에서 검증할 수 없으므로 운영 테스트 1회 필요.
