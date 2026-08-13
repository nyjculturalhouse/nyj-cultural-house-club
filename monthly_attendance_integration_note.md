# 월별 1~5주차 출석 연동 현황

현재 공개 Google Apps Script의 `getAttendanceStatus`는 동아리별 `lastWeek`, `thisWeek`만 반환한다. 따라서 웹은 직전·현재 주차 상태만 실제 데이터로 표시할 수 있다.

`/home/ubuntu/monthly_attendance_gas_patch.gs`에는 다음을 추가하는 코드가 준비되어 있다.

1. `getMonthlyAttendanceStatus` 조회 모드
2. 해당 월의 실제 1~5주차 범위 생성
3. 동아리별 주차 완료 상태 계산
4. 주차 기준의 중복 제출 방지 및 `attendanceWeek` 저장

Google Apps Script에 적용·배포된 뒤 웹 서버가 새 조회 모드를 호출하도록 연결한다.
