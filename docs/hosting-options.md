# 문화의집 웹시스템 호스팅 선택지

## 결론

현재 웹사이트는 단순한 소개 페이지가 아닙니다. 프로그램 등록·임시저장·사진 업로드·관리자 비밀번호와 OAuth·출석 통계·Google Apps Script 연동을 포함하므로 **서버와 비밀 환경 변수, 데이터 저장소가 필요한 풀스택 서비스**입니다. 따라서 GitHub Pages만으로 현재 기능을 그대로 운영하는 방식은 적합하지 않습니다.

가장 부담이 적은 선택은 현재처럼 관리형 호스팅을 유지하고 GitHub를 코드 원본으로 쓰는 방식입니다. 외부 호스팅이 필요하다면, 현재 Express 서버를 거의 그대로 옮길 수 있는 **Render 또는 Railway**를 우선 검토하는 것이 좋습니다. Cloudflare는 충분히 가능하지만, 현재 서버를 Workers/Pages Functions 방식으로 재구성해야 하므로 별도 이식 프로젝트로 보는 편이 안전합니다.

| 방식 | 현재 기능 유지 | GitHub 푸시 자동 배포 | 이전 작업량 | 추천도 |
|---|---:|---:|---:|---:|
| 현 관리형 호스팅 + GitHub | 높음 | 코드 백업·동기화 중심 | 없음 | 가장 권장 |
| Render 또는 Railway | 높음 | 가능 | 낮음~중간 | 외부 이전 시 권장 |
| Vercel | 높음 | 가능 | 중간 | 서버리스 운영을 원할 때 |
| Cloudflare Pages + Workers + D1/R2 | 높음 | 가능 | 높음 | 장기 재구축 시 |
| GitHub Pages + Google Apps Script | 일부만 | 가능 | 중간~높음 | 기능 단순화 시 |
| GitHub Pages만 사용 | 낮음 | 가능 | 높음 | 현재 사이트에는 비권장 |

## 1. 현재 관리형 호스팅 유지 + GitHub 저장소

현재 공개 주소와 서버 구조를 유지하면서 GitHub 저장소를 코드의 원본으로 관리하는 방식입니다. 관리 화면, OAuth, 데이터베이스, 사진 저장, Apps Script를 그대로 유지할 수 있고 배포·비밀값·롤백을 별도 관리할 필요가 없습니다. 커스텀 도메인도 연결할 수 있습니다. 이 프로젝트처럼 서버 기능이 있는 서비스에는 운영 부담이 가장 적습니다.

## 2. Render 또는 Railway로 이전

두 서비스 모두 GitHub 저장소와 연결하면 푸시마다 Node/Express 앱을 빌드·배포할 수 있습니다. 현재 Express·tRPC 서버를 유지할 수 있어 코드 변경이 Cloudflare보다 작습니다. Render는 연결된 Git 브랜치에 푸시할 때 자동으로 다시 배포하며, Railway도 GitHub 저장소에서 Express 앱을 배포하는 흐름을 공식 지원합니다.[1] [2]

다만 다음은 이전해야 합니다.

| 대상 | 필요한 조치 |
|---|---|
| 환경 변수 | `DATABASE_URL`, JWT·OAuth·Apps Script 주소, 관리자 비밀번호를 새 호스팅의 비밀값으로 등록 |
| 데이터베이스 | 현재 프로그램·사용자 테이블을 외부 MySQL/Postgres 등으로 이전하거나 원격 DB 연결 검증 |
| 사진 | 현재 저장소 경로를 S3, Cloudflare R2 또는 호스팅 연동 저장소로 이전 |
| OAuth | 새 도메인의 콜백 URL을 인증 제공자 설정에 등록 |
| 도메인 | DNS와 HTTPS 설정을 새 서비스로 연결 |

> **추천 상황:** 현재 기능을 유지하면서 호스팅만 GitHub 연동 외부 서비스로 바꾸고 싶은 경우입니다.

## 3. Vercel로 이전

Vercel은 Express 앱을 단일 Vercel Function으로 배포할 수 있고 Git 저장소 연결 배포를 지원합니다.[3] 다만 서버리스 환경이므로 장시간 연결, 로컬 파일 저장, 일부 Express 전제는 점검해야 합니다. 특히 정적 파일은 Express의 `express.static()`이 아닌 `public/` 디렉터리로 처리해야 한다는 제약이 있습니다.[3]

이 프로젝트는 요청 단위의 관리자 CRUD와 Apps Script 조회 위주이므로 기술적으로 가능한 선택입니다. 다만 데이터베이스·사진 저장소·OAuth 콜백 도메인은 별도로 이전해야 합니다.

> **추천 상황:** 자동 미리보기 배포와 서버리스 운영을 선호하고, 외부 DB·저장소를 함께 관리할 수 있는 경우입니다.

## 4. Cloudflare Pages + Workers + D1/R2

Cloudflare Pages는 Git 공급자 연결 배포와 Pages Functions를 제공하며, Workers는 일부 Node.js 호환 계층을 제공합니다.[4] [5] 따라서 React 정적 화면은 Pages에, API는 Workers/Pages Functions에, 사진은 R2에, 데이터는 D1 또는 외부 DB에 둘 수 있습니다.

하지만 현재 서버 코드를 버튼 하나로 옮기는 방식은 아닙니다. Workers의 Node 호환은 일부 API만 완전 지원하고 일부는 부분 지원 또는 polyfill이므로, Express·Drizzle·OAuth·`https.Agent` 사용 코드를 Workers 런타임에 맞게 재구성해야 합니다.[4] 이를 위해서는 API 라우터, DB 드라이버, 사진 저장, 세션·OAuth를 별도 이식하고 테스트해야 합니다.

> **추천 상황:** Cloudflare 생태계(R2·D1·Workers)를 장기 표준으로 삼고, 이식 개발 시간을 확보할 수 있는 경우입니다.

## 5. GitHub Pages + Google Apps Script

공개 사이트를 GitHub Pages에 두고, 출석·대관·프로그램 데이터를 Google Apps Script 웹앱으로 처리하는 방식입니다. GitHub Pages는 저장소의 HTML·CSS·JavaScript를 발행하는 **정적 호스팅**입니다.[6] 따라서 관리자 로그인, 안전한 비밀번호 검증, 사진 파일 업로드는 Apps Script·Google Sheets·Google Drive 쪽으로 새로 설계해야 합니다.

현재처럼 데이터베이스와 S3에 프로그램을 보관하는 대신, Google Sheets를 프로그램 원본으로, Drive URL을 사진 원본으로 사용하도록 바꾸면 구현은 가능합니다. 그러나 클라이언트에 비밀번호가 노출되지 않도록 Apps Script 쪽 인증을 다시 설계해야 하고, 관리자 화면의 기능도 상당 부분 다시 작성해야 합니다.

> **추천 상황:** 프로그램 관리를 모두 Google Sheets 중심으로 단순화하고, 별도 서버·DB 운영을 없애고 싶은 경우입니다.

## 6. GitHub Pages만 사용

소개·안내·외부 링크 같은 정적 공개 화면만 운영한다면 가능합니다. 하지만 GitHub Pages는 정적 파일 기반이므로 현재의 관리자 로그인, DB 저장, 사진 업로드, 안전한 비밀값 처리는 제공하지 않습니다.[6] GitHub도 민감한 거래·비밀번호 전송 용도로 Pages를 사용하지 말 것을 명시합니다.[7]

> **추천 상황:** 관리자 기능을 완전히 제거하고, Google Form·네이버폼·남양주문화재단 링크만 연결하는 홍보 사이트로 축소할 때입니다.

## 권장 순서

1. **지금은 현 호스팅 유지 + GitHub 관리**를 선택합니다. 현재 기능 손실과 이식 위험이 없습니다.
2. 외부 호스팅이 꼭 필요하면 **Render 또는 Railway**에 먼저 시험 배포합니다. 현재 Node/Express 구조와 가장 잘 맞습니다.
3. Cloudflare는 향후 사진을 R2, 데이터를 D1으로 운영하고 싶을 때 별도의 이식 프로젝트로 진행합니다.
4. 비용과 관리 부담을 가장 낮추고 싶다면 GitHub Pages가 아니라 **GitHub Pages + Apps Script로 기능을 단순화**하는 방향을 검토합니다.

## 참고 자료

[1] [Render: Deploy a Node Express App](https://render.com/docs/deploy-node-express-app)

[2] [Railway: Deploy an Express App](https://docs.railway.com/guides/express)

[3] [Vercel: Express on Vercel](https://vercel.com/docs/frameworks/backend/express)

[4] [Cloudflare: Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

[5] [Cloudflare Pages overview](https://developers.cloudflare.com/pages/)

[6] [GitHub: What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

[7] [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
