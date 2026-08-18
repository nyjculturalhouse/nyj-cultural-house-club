# Apps Script 관리자 웹앱 설계 근거

Google Apps Script 웹앱은 `doGet(e)` 또는 `doPost(e)`가 HtmlOutput 또는 TextOutput을 반환하면 브라우저용 웹앱으로 배포할 수 있다. 배포 시 스크립트 소유자 권한으로 실행하거나, 접근 사용자의 권한으로 실행할 수 있다. 공개 조회 API와 관리자 UI를 분리하면 공개 사이트는 읽기 전용 TextOutput API를 사용하고, 관리자 UI는 기존 Apps Script 소유 Google 계정으로 로그인한 뒤 사용할 수 있다.

Apps Script HTML Service는 프로젝트 안의 HTML 파일을 웹앱으로 제공한다. HTML Service 페이지에서는 `google.script.run`을 통해 Apps Script의 서버 함수를 비동기로 호출하고 성공·실패 처리기를 설정할 수 있다. 이 방식에서는 관리자용 업로드 비밀값을 GitHub Pages의 공개 JavaScript에 넣지 않아도 된다.

## 공식 출처

1. Apps Script Web Apps: https://developers.google.com/apps-script/guides/web
2. Apps Script HTML Service: https://developers.google.com/apps-script/guides/html
3. google.script.run: https://developers.google.com/apps-script/guides/html/reference/run
