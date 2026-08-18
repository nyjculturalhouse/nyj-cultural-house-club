# Google Drive 자동 사진 업로드 설계 근거

Google Apps Script의 DriveApp은 Blob으로 파일을 만들고, 파일·폴더를 검색·수정할 수 있다. 파일 객체는 공유 범위를 설정하는 `setSharing(accessType, permissionType)`, 파일 ID를 가져오는 `getId()`, 공유 링크 보안을 확인하는 `getResourceKey()` 메서드를 제공한다. 따라서 Apps Script 웹앱이 관리자 사진 데이터를 받아 지정 폴더에 저장하고, 공개 보기 권한을 설정한 뒤 파일 ID 기반 이미지 주소를 프로그램 시트에 기록하는 구조를 구현할 수 있다.

DriveApp 파일 생성·공유 작업에는 Google Drive 권한 범위가 필요하다. Apps Script는 계정별 서비스 쿼터와 실행 시간 제한이 있으므로, 업로드 파일은 현재 관리자 화면과 동일하게 JPG·PNG·WEBP 및 5MB 이하로 제한한다.

## 공식 출처

1. Google Apps Script File API: https://developers.google.com/apps-script/reference/drive/file
2. Google Apps Script DriveApp API: https://developers.google.com/apps-script/reference/drive/drive-app
3. Google Apps Script 서비스 쿼터: https://developers.google.com/apps-script/guides/services/quotas
