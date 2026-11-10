# HOME FILM — Railway + MySQL A안 (1차 실제 구현)

## 현재 포함된 기능
- 독립 Node.js/Express 서버, Railway PORT 바인딩
- MySQL 접수 테이블 `intakes` 생성 SQL
- `POST /api/intake` 질문/상담 통합 접수, Cloudflare Turnstile 서버 검증, 요청 제한
- `GET /health` DB 연결 점검
- 관리자용 `GET /api/admin/intakes`, `PATCH /api/admin/intakes/:id` (임시 서버 간 토큰 인증)
- 단위 테스트 6개

## 배포 순서
1. Railway에 **새 프로젝트**를 만들고 MySQL을 추가합니다. 기존 Korea GPS Guide 프로젝트와 연결하지 마세요.
2. 이 ZIP의 소스를 별도 GitHub 저장소에 올리고 Railway에서 해당 저장소를 서비스로 배포합니다.
3. Railway 서비스 Variables에 `MYSQL_URL`을 MySQL 서비스의 참조 변수로 연결합니다. `TURNSTILE_SECRET_KEY`와 `ADMIN_API_TOKEN`도 서버 변수로 설정합니다. 키를 GitHub에 올리지 마세요.
4. Railway MySQL 콘솔 또는 MySQL 클라이언트에서 `sql/schema.sql`을 한 번 실행합니다.
5. Railway 생성 도메인의 `/health`에서 `{ "ok": true }`가 나오는지 확인합니다.
6. 기존 홈페이지를 신규 API로 전환하는 것은 **운영 테스트 성공 후** 별도 작업으로 진행합니다.

## API 예시
POST /api/intake, Origin: https://homefilm.co.kr, Content-Type: application/json
`{"type":"question","author":"테스트","title":"문의","body":"질문 내용","turnstile_token":"실제 Turnstile 토큰"}`
상담: `type=consultation`, author/body 필수, phone 선택.

## 주의
- 현재 프런트엔드·기존 관리자 로그인은 **연결하지 않았습니다**. 관리자 토큰 API는 1차 테스트용이며 브라우저에 토큰을 넣지 마세요. 정식 관리자 인증과 사진/회원/마이페이지는 후속 구현입니다.
- Cloudflare 검증은 계속 필요합니다. 기존 키 문제라면 새 서버에서도 실패할 수 있으므로 `TURNSTILE_SECRET_KEY`가 현재 사이트키와 같은 위젯인지 확인해야 합니다.
- 실운영 전 HTTPS 도메인, CORS, 관리자 인증, 백업, 개인정보 보존기간, 요청 제한의 다중 인스턴스 저장소를 추가 점검해야 합니다.
- 기존 Supabase 데이터는 자동 이전되지 않습니다. 데이터 백업·이관·검증 후에만 전환합니다.
- Korea GPS Guide에는 어떤 변경도 하지 않습니다.
