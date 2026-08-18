# 무예산 운영을 위한 호스팅 선택지

## 전제

이 문서는 하루 출석 등록 약 10건, 주간 사진 업로드 10건 미만이라는 운영 규모를 기준으로 작성했습니다. 이를 한 달로 환산하면 출석 등록은 약 **310건**, 사진 업로드는 약 **44건**입니다. 사진을 매번 최대 허용 크기인 5MB로 올린다고 가정해도 월 최대 약 **218MB**이므로, 소규모 문화의집 운영량입니다.

> **Manus Lite 유지 가능 여부:** 현재 요금제에서 이 프로젝트를 계속 운영할 수 있는지는 계정별 이용 정책에 따라 달라질 수 있습니다. 이 항목은 [Manus 도움말](https://help.manus.im)에서 확인해야 합니다.

## 무예산 권장 순서

| 우선순위 | 운영 조합 | 현재 기능 유지 수준 | 매월 비용 | 초기 작업 |
|---:|---|---:|---:|---:|
| 1 | **GitHub Pages + Google Apps Script + Google Sheets/Drive** | 높음 | 0원 | 중간 |
| 2 | **Cloudflare Pages + Workers + D1, 사진은 Google Drive** | 높음 | 0원 한도 내 | 높음 |
| 3 | **Cloudflare Pages + Workers + D1 + R2** | 매우 높음 | 무료 한도 내 | 높음 |
| 4 | 현 호스팅 유지 | 가장 높음 | 요금제 확인 필요 | 없음 |

## 1. 가장 현실적인 무예산안: GitHub Pages + Google Apps Script

이 방식은 **공개 웹 화면을 GitHub Pages**, 데이터와 관리자 동작을 **기존 Google Apps Script**, 출석·프로그램 데이터를 **Google Sheets**, 대표 사진을 **Google Drive**에 두는 구조입니다. 이미 출석·대관·외부활동·프로그램을 처리하는 Apps Script가 있으므로, 새 서버를 무료로 유지하려는 목적에는 가장 운영 부담이 적습니다.

| 현재 기능 | 무예산 전환 후 구성 |
|---|---|
| 동아리 출석 | GitHub Pages 화면 → Apps Script → Google Sheets |
| 대관·외부활동 | 현재 Apps Script·Sheet 흐름 유지 |
| 프로그램 목록·상세 | GitHub Pages 화면 → Apps Script → Google Sheets |
| 프로그램 사진 | Google Drive 공개 이미지 URL 또는 Apps Script 파일 제공 주소 |
| 관리자 프로그램 등록·임시저장 | Apps Script 관리자 API → Google Sheets의 공개 여부·임시저장 열 |
| 관리자 보호 | Apps Script의 Script Properties에 보관한 비밀번호 또는 Google 계정 허용 목록 |
| 출석 통계·엑셀 | Apps Script에서 집계·CSV/XLSX 생성 또는 브라우저 다운로드 |

### 장점

GitHub Pages는 저장소의 정적 HTML·CSS·JavaScript를 발행하는 서비스이므로 공개 화면 배포는 무료로 운영할 수 있습니다.[1] Google Apps Script는 이미 사용 중인 Google 계정·Workspace 안에서 Sheets·Drive와 연결할 수 있고, Google은 일별 URL Fetch·Spreadsheet·Drive 작업 한도를 제공합니다.[2] 현재 규모인 월 310건 출석과 월 약 44건 사진은 일반적인 소규모 운영량입니다.

### 바뀌는 부분

현재의 Node/Express·tRPC·TiDB·S3·Manus OAuth는 제거하거나 대체해야 합니다. 화면 디자인과 사용자 기능은 유지할 수 있지만, **서버 구현은 Apps Script 중심으로 다시 연결**해야 합니다. 관리자 비밀번호는 브라우저 코드에 넣지 않고 Apps Script의 Script Properties에서 검증해야 합니다.

### 주의할 점

Google Apps Script에는 계정별·일별 쿼터와 한 번 실행당 6분 제한이 있습니다.[2] 현재 사용량에는 충분할 가능성이 높지만, 공용 웹앱을 열어 두는 경우 비정상 호출을 막기 위해 관리자 API에는 비밀번호 검증·요청 제한·감사 기록을 넣어야 합니다.

> **공공기관에 가장 권장:** 이미 Google Sheets와 Apps Script를 운영 중이고, 월별 비용이 반드시 0원이어야 할 때입니다.

## 2. Cloudflare 무료 조합: Pages + Workers + D1

Cloudflare Pages는 정적 자산 요청을 무료로 제공하고, Pages Functions 요청은 Workers Free 한도와 합산됩니다.[3] Workers Free는 하루 100,000건 요청, 10ms CPU 시간, 128MB 메모리 한도를 제공합니다.[4] D1 Free는 하루 500만 행 읽기, 10만 행 쓰기, 총 5GB 저장소를 제공합니다.[5]

현재 출석 등록 약 10건/일은 Workers·D1의 무료 쓰기 한도보다 매우 작습니다. 공개 프로그램 조회·출석 조회가 합쳐 하루 10만 요청을 넘지 않는 한, 일반적인 소규모 문화의집 운영에는 무료 한도 안에서 가능성이 높습니다.

| 구성 요소 | Cloudflare 무료 대안 |
|---|---|
| 공개 React 화면 | Cloudflare Pages |
| API·관리자 비밀번호 검증 | Workers 또는 Pages Functions |
| 프로그램·사용자·임시저장 데이터 | D1(SQLite) |
| 사진 | Google Drive 또는 R2 |
| 출석 원본 | 현재 Google Apps Script·Sheets 유지 |
| 관리자 접근 | Cloudflare Access 또는 Workers에서 Google 로그인/비밀번호 검증 |

### 중요한 제약

현재 Express·tRPC 서버를 그대로 배포하는 방식은 아닙니다. Workers의 Node 호환은 일부 API만 완전 지원하고 일부 API는 부분 지원 또는 polyfill이므로, 현재 Express·Drizzle·OAuth·S3 코드는 Workers 방식으로 다시 작성·테스트해야 합니다.[6] 무료 Workers는 요청당 CPU가 10ms이므로, 이미지 변환이나 무거운 서버 처리에는 맞지 않습니다.[4]

> **공공기관에 적합한 경우:** 초기 이식 개발은 감수할 수 있지만, 이후에는 서버·DB를 Cloudflare 무료 한도 안에서 운영하고 싶은 경우입니다.

## 3. Cloudflare R2를 사진 저장소로 쓰는 경우

R2 Free에는 월 10GB 저장, Class A 100만 회, Class B 1,000만 회, 인터넷 전송 무료 한도가 있습니다.[7] 최대 5MB 사진을 월 약 44건 올려도 월 약 218MB이므로, 사진을 삭제하지 않는 경우에도 단순 계산상 10GB에 도달하기까지 약 47개월의 여유가 있습니다.

다만 **무조건 0원**이 원칙이면 사진은 R2 대신 기존 Google Drive를 쓰는 편이 더 안전합니다. R2는 무료 한도를 넘으면 사용량 과금 구조이므로, 사진 조회가 예상보다 커지거나 원본 사진을 계속 누적할 때 별도 관리가 필요합니다.[7] R2를 쓴다면 사진 최대 용량 유지, 오래된 원본 삭제, 사용량 알림을 반드시 함께 설정해야 합니다.

## 무예산 기준 최종 권장안

### 권장안 A — 비용 0원을 가장 우선할 때

**GitHub Pages + Google Apps Script + Google Sheets + Google Drive**로 전환합니다. 이미 사용 중인 Apps Script와 시트를 최대한 활용하고, 프로그램 사진도 Drive로 옮깁니다. 현재의 화면 디자인, 출석·대관·외부활동·프로그램 공개·관리자 등록·임시저장·미리보기는 유지하되 Node 서버 기능을 Apps Script API로 옮깁니다.

### 권장안 B — 향후 확장성과 성능을 우선할 때

**Cloudflare Pages + Workers + D1**으로 옮기고, 초기에는 사진을 Google Drive에 둡니다. 예산이 생기거나 사용량 관리 체계가 생긴 뒤 R2로 사진 저장을 이전합니다. 이 방식은 무료 한도에서는 운영 가능성이 높지만, 현재 서버 코드를 Workers에 맞게 새로 작성해야 합니다.

## 지금 바로 선택할 일

1. **비용 0원이 절대 조건**이면 권장안 A를 선택합니다.
2. **Cloudflare로 장기 운영 기반을 만들고 싶다**면 권장안 B를 선택합니다.
3. Manus Lite 유지 여부는 [Manus 도움말](https://help.manus.im)에서 먼저 확인합니다.

## 참고 자료

[1] [GitHub Pages 개요](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

[2] [Google Apps Script 서비스 쿼터](https://developers.google.com/apps-script/guides/services/quotas)

[3] [Cloudflare Pages Functions 가격·무료 요청 한도](https://developers.cloudflare.com/pages/functions/pricing/)

[4] [Cloudflare Workers Free 한도](https://developers.cloudflare.com/workers/platform/limits/)

[5] [Cloudflare D1 Free 한도](https://developers.cloudflare.com/d1/platform/pricing/)

[6] [Cloudflare Workers Node.js 호환](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

[7] [Cloudflare R2 무료 한도](https://developers.cloudflare.com/r2/pricing/)
