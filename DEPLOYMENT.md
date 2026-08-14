# 배포 가이드

## 1. Google Apps Script 웹앱 배포

`google-apps-script/Code.gs`의 전체 내용을 스프레드시트에 연결된 Apps Script 프로젝트에 붙여넣습니다. 프로젝트 시간대는 `Asia/Seoul`로 지정하고, `initializeSheets`를 한 번 실행해 권한을 승인합니다. 기존 `출석부` 시트가 있으면 새 코드가 헤더를 덮어쓰지 않으므로 기존 데이터는 유지됩니다.

그다음 **배포 → 새 배포 → 웹 앱**에서 새 버전을 배포합니다. 운영 웹앱에서 필요한 사용자만 접근할 수 있도록 권한을 설정하고, 발급된 `/exec` URL을 복사합니다. `/dev` URL은 개발자 권한에 묶이므로 운영 서비스에는 사용하지 않습니다.

## 2. 웹 프로젝트 환경 변수

서비스를 실행하는 환경에 다음 값을 설정합니다. `GAS_WEB_APP_URL`은 민감 정보가 아닌 공개 웹앱 주소이지만, Apps Script를 재배포해 주소가 바뀌면 반드시 함께 변경해야 합니다.

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `GAS_WEB_APP_URL` | 예 | Google Apps Script 웹앱의 `/exec` URL입니다. |
| `NODE_ENV` | 예 | 운영 환경에는 `production`을 사용합니다. |
| `DATABASE_URL` | 선택 | 현재 출석 흐름은 필요하지 않지만, 로그인·관리 기능을 운영하면 필요합니다. |

## 3. GitHub 검증 자동화

저장소의 `.github/workflows/verify.yml`은 `main` 푸시와 Pull Request에서 `pnpm test`, `pnpm check`, `pnpm build`를 실행합니다. Google Apps Script 호출은 단위 테스트에서 모의 응답 정규화로 검증하므로 GitHub Actions에 웹앱 URL을 넣을 필요가 없습니다.

## 4. 운영 점검

배포 후 아래 URL을 확인합니다. `health` 응답에 `ok: true`가 표시되면 Apps Script 기본 연결이 정상입니다.

```text
https://script.google.com/macros/s/배포_ID/exec?mode=health
```

월간 출석 응답은 아래 형식입니다.

```text
https://script.google.com/macros/s/배포_ID/exec?mode=getMonthlyAttendanceStatus&year=2026&month=8
```

응답의 각 동아리는 `weeks` 배열 안에 `index`, `start`, `end`, `completed`를 가집니다. 웹 화면은 이 응답을 기준으로 완료 동아리를 숨기고, 미완료 주차만 출석 화면으로 연결합니다.

## 5. 간소화된 출석 제출 적용

최신 `Code.gs`는 회원 이름 대신 **출석 인원 수**를 받습니다. 웹 화면은 `attendanceCount`에 1 이상의 정수를 보내며, 출석부의 `출석인원` 열에 숫자를 기록합니다. 이 변경을 적용하려면 `google-apps-script/Code.gs` 전체를 다시 반영하고 웹앱을 새 버전으로 배포해야 합니다.

## 6. 대관·외부활동 조회 모드 배포 확인

현재 운영 `/exec` URL을 2026-08-14에 확인한 결과, `getBookings`와 `getActivities`는 모두 `{"error":"지원하지 않는 요청입니다."}`를 반환했습니다. 즉, 저장소의 `Code.gs`에는 구현되어 있어도 운영 웹앱에는 아직 새 버전이 배포되지 않은 상태입니다.

다음 네 가지 모드를 포함한 `Code.gs` 전체를 반영한 뒤 **배포 → 배포 관리 → 수정 → 새 버전**으로 웹앱 버전을 갱신해야 합니다.

| 모드 | 용도 | 배포 후 확인 URL |
| --- | --- | --- |
| `getBookings` | 대관 캘린더 조회 | `/exec?mode=getBookings` |
| `getActivities` | 외부활동 캘린더 조회 | `/exec?mode=getActivities` |
| `submitBooking` | 대관 신청 저장 | 운영 테스트 데이터로만 확인 |
| `submitExternal` | 외부활동 등록 | 운영 테스트 데이터로만 확인 |

배포 직후 위 조회 URL이 빈 배열 `[]` 또는 데이터 배열을 반환하면 화면의 오류 안내가 정상적인 빈 상태 또는 일정 목록으로 전환됩니다.
