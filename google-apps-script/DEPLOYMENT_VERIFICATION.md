# 새 Google Apps Script 연동 검증

검증 대상 웹앱 URL은 다음과 같다.

```text
https://script.google.com/macros/s/AKfycbyDiCKTYTFJNc5_2iS9j1ONuUdvVZfaLSQl_LhR4AFPr_ayrEuEU2S8IQJVwPBoQ5sLvA/exec
```

| 확인 항목 | 결과 |
| --- | --- |
| `mode=health` | HTTP 200, `{"ok":true,"timeZone":"Asia/Seoul"}` 응답 확인 |
| `mode=getMonthlyAttendanceStatus&year=2026&month=8` | 동아리별 실제 1~5주차 `index`, `start`, `end`, `completed` 응답 확인 |
| 서버 통합 테스트 | 새 URL 기준 월간 출석 응답 테스트 통과 |
| 메인 월간 출석 UI | 동아리별 실제 1~5주차 상태·미출석 수·드릴다운 표시 확인 |

새 월간 엔드포인트가 제공하는 모든 월간 주차는 웹 화면에서 `출석 완료` 또는 `출석하기` 상태로 표시된다. 기존 최근 2주차 API는 새 월간 엔드포인트에 문제가 있을 때의 호환 fallback으로 유지한다.
