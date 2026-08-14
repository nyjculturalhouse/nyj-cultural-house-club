# Google Apps Script 출석 API

이 폴더는 남양주시 문화의집 동아리 시스템에서 사용하는 **Google Sheets 기반 API의 전체 코드**입니다. 기존 Apps Script 프로젝트의 `Code.gs`를 이 폴더의 [`Code.gs`](./Code.gs)로 교체하면 동아리·회원 조회, 출석 등록, 최근 2주차 호환 조회, 월간 1~5주차 이력 조회를 하나의 웹앱에서 제공합니다.

## 시트 구조

`동아리정보` 시트는 헤더명을 인식하며, 기존 시트와 호환하기 위해 헤더를 찾지 못할 때는 A열=요일, B열=동아리명, C열=회원으로 처리합니다. 한 동아리의 회원은 쉼표·세미콜론·줄바꿈으로 구분해 입력할 수 있습니다.

| 시트 | 필수 열 | 설명 |
| --- | --- | --- |
| `동아리정보` | `요일`, `동아리명`, `회원` | `getClubs`, `getMembers`의 원본 데이터입니다. |
| `출석부` | `출석일`, `동아리명`, `출석인원`, `출석자` | 기존 4열 데이터와 호환됩니다. 새 제출부터 `요일`, `출석주차` 열을 추가 기록합니다. |

> **중요:** Apps Script 프로젝트 설정의 시간대는 반드시 `Asia/Seoul`로 지정합니다. 월간 1~5주차 계산과 `YYYY-MM-DD` 날짜 키가 웹 화면과 같은 한국 시간대를 사용합니다.

## 배포 순서

1. 대상 스프레드시트에서 **확장 프로그램 → Apps Script**를 엽니다.
2. 기존 `Code.gs` 내용을 [`Code.gs`](./Code.gs)의 전체 내용으로 교체하고, `appsscript.json`의 시간대 설정을 반영합니다.
3. 저장 후 `initializeSheets`를 한 번 실행해 권한을 승인합니다. 기존 `출석부` 시트가 있으면 데이터는 유지됩니다.
4. **배포 → 새 배포 → 웹 앱**을 선택하고, 실행 사용자는 소유자·액세스 권한은 사이트 방문자가 조회·제출할 수 있는 수준으로 설정합니다.
5. 새 웹앱 URL의 `/exec` 주소를 GitHub Pages의 `assets/config.js` 또는 Node 배포의 `GAS_WEB_APP_URL`에 넣습니다.

## 지원 API

| HTTP | `mode` | 주요 입력 | 응답 |
| --- | --- | --- | --- |
| GET | `getClubs` | `day=화` | 해당 요일의 동아리명 배열 |
| GET | `getMembers` | `club=글♥낭` | 해당 동아리의 회원 배열 |
| GET | `getAttendanceStatus` | 없음 | 기존 UI 호환용 `lastWeek`, `thisWeek` 배열 |
| GET | `getMonthlyAttendanceStatus` | `year=2026&month=8` | 동아리별 실제 1~5주차 완료 이력 |
| POST | `submitAttendance` | `clubName`, `attendanceCount`, `day`, `attendanceWeek` | 중복 방지 후 출석 인원 기록 |

월간 이력은 해당 월에 실제 존재하는 주차만 반환하며, 달력상 여섯 번째 구간이 생기는 경우에도 사용자 화면 정책에 맞춰 **5주차에 합쳐** 반환합니다.

출석 화면은 회원 이름을 선택하지 않고 `attendanceCount`에 1 이상의 정수를 전달합니다. `출석자` 열에는 개인정보 대신 `인원 수 입력`으로 기록되며, 기존 화면처럼 `attendees` 배열을 보내는 요청도 계속 처리합니다.
