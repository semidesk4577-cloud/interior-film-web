HOME FILM STEP17 — 안전한 고객 질문 접수

현재 정상 작동하는 사진 갤러리·관리자·상담 소스는 변경하지 않습니다.

1) Supabase Edge Functions에 새 함수 submit-question 생성.
   supabase/functions/submit-question/index.ts 내용을 붙여넣고 배포.
   Verify JWT를 OFF로 설정 (익명 질문 허용; 서버에서 Turnstile 검증).
   서버 비밀 TURNSTILE_SECRET_KEY가 존재하는지 확인. 절대 GitHub에 비밀 키 업로드 금지.
2) GitHub 루트에 content.js, questions.html 두 파일만 덮어쓰기 후 Commit.
3) https://homefilm.co.kr/questions.html 에서 Turnstile 완료 후 시험 질문 1개 제출.
4) 관리자 콘텐츠 페이지에서 답변 작성 후 공개.

중요: 이 ZIP은 문법 검사만 완료한 준비본입니다. Supabase 실제 배포/접수는 검증되지 않았습니다.
SQL은 필요 없습니다. 기존 익명 INSERT 차단 정책을 유지합니다.
질문이 등록돼도 관리자 공개 전까지 공개 목록에는 나타나지 않습니다.
비회원 질문 스팸 방지는 Turnstile 단일 방어선이며, 운영 전 추가 요청 제한/모니터링이 권장됩니다.
