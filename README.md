# 남양주시 문화의집 동아리 시스템

남양주시 문화의집 동아리의 출석 확인, 공간 예약, 일정, 외부활동 공유 화면을 제공하는 웹 프로젝트입니다. 메인 화면은 SUIT 기반의 검정·흰색 에디토리얼 디자인이며, 월간 출석 패널은 동아리별 **실제 1~5주차** 이력을 보여 줍니다.

## 구성

| 영역 | 기술 | 역할 |
| --- | --- | --- |
| 클라이언트 | React 19, Vite, Tailwind CSS | 메인 화면과 출석 확인 UX를 제공합니다. |
| 서버 | Express, tRPC | Google Apps Script의 출석 현황을 안정적으로 중계합니다. |
| 데이터 | Google Sheets, Apps Script | 동아리·회원·출석 데이터를 관리하고 웹앱 API로 제공합니다. |
| 검증 | Vitest, GitHub Actions | 주차 계산, 응답 정규화, 타입 검사, 프로덕션 빌드를 검증합니다. |

## 시작하기

개발 환경에는 Node.js 22 이상과 pnpm이 필요합니다. 의존성을 설치한 다음 실행 환경에 Google Apps Script 웹앱 URL을 `GAS_WEB_APP_URL`로 설정합니다. 기존 웹앱 URL을 계속 사용할 경우에는 현재 기본값으로도 동작하지만, Apps Script를 새로 배포했다면 새 `/exec` URL을 설정해야 합니다.

```bash
corepack enable
pnpm install
pnpm dev
```

다음 명령은 각각 단위 테스트, TypeScript 검사, 프로덕션 빌드를 실행합니다.

```bash
pnpm test
pnpm check
pnpm build
```

## Google Apps Script 연결

Google Apps Script 전체 코드는 [`google-apps-script/`](./google-apps-script) 폴더에 있습니다. 스프레드시트에 바인드된 Apps Script 프로젝트의 `Code.gs`를 [`google-apps-script/Code.gs`](./google-apps-script/Code.gs)로 교체한 후 새 웹앱 배포를 만들고, 생성된 `/exec` URL을 `.env`의 `GAS_WEB_APP_URL`에 입력합니다.

> 월간 출석은 앱 화면 정책에 맞춰 해당 달에 존재하는 주차만 표시하고, 달력상 여섯 번째 구간이 생겨도 **5주차로 합산**합니다. 기존 최근 2주차 응답(`getAttendanceStatus`)도 유지하므로 기존 화면을 즉시 교체하지 않아도 됩니다.

## GitHub에 올리기

이 폴더 전체를 새 GitHub 저장소의 루트에 올립니다. `.env` 파일은 커밋하지 않고, 실제 서비스 배포 환경에서 `GAS_WEB_APP_URL`을 환경 변수로 설정합니다. `main` 브랜치에 푸시하거나 Pull Request를 열면 [검증 워크플로](./.github/workflows/verify.yml)가 테스트·타입 검사·빌드를 수행합니다.

```bash
git init
git add .
git commit -m "feat: add monthly attendance system"
git branch -M main
git remote add origin https://github.com/ORGANIZATION/REPOSITORY.git
git push -u origin main
```

## 운영 배포

이 프로젝트의 메인 React 화면은 Google Apps Script 통신을 서버에서 중계하므로 **Node.js 실행 환경**에 배포해야 합니다. GitHub는 소스 코드와 검증 자동화의 저장소로 사용하고, 실제 실행은 Node.js를 지원하는 호스팅에서 다음 흐름으로 수행합니다.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

자세한 환경 변수·Apps Script 배포 순서는 [`DEPLOYMENT.md`](./DEPLOYMENT.md)를 확인합니다.
