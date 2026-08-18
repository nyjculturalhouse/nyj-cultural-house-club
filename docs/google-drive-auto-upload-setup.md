# Google Drive 자동 사진 저장 설정

관리자는 이 설정을 마친 뒤부터 **관리자 화면에서 사진만 선택**하면 됩니다. 사진은 자동으로 Google Drive의 `남양주시 문화의집 프로그램 사진` 폴더에 저장되고, 프로그램 행에 공개용 사진 주소가 채워집니다.

## 처음 한 번만 하는 설정

| 순서 | 할 일 | 결과 |
|---:|---|---|
| 1 | 첨부받은 최신 `Code.gs` 전체를 Apps Script 편집기에 붙여넣고 저장 | Drive 업로드 기능 추가 |
| 2 | Apps Script **프로젝트 설정 → 스크립트 속성**에서 `GAS_DRIVE_UPLOAD_TOKEN`을 추가 | 업로드 요청 보호 |
| 3 | 위 속성 값에는 프로젝트의 **Secrets 카드**에 이미 등록된 `GAS_DRIVE_UPLOAD_TOKEN` 값을 그대로 복사 | 웹 서버와 Apps Script가 같은 요청인지 확인 |
| 4 | 편집기에서 `initializeSheets`를 한 번 실행하고 Google Drive 권한을 승인 | 스크립트가 사진 폴더를 만들 권한 획득 |
| 5 | **배포 관리 → 수정 → 새 버전 → 배포**를 실행 | 기존 `/exec` 주소에서 새 업로드 기능 사용 |
| 6 | 관리자 프로그램 시트에서 4:5, 5MB 이하 JPG·PNG·WEBP 사진 한 장을 올려보기 | Drive 폴더 생성·사진 연결 확인 |

## Google Drive 공유 정책

프로그램 사진은 공개 웹사이트에서 보여야 하므로, 업로드한 **사진 파일만 ‘링크가 있는 모든 사용자: 보기’** 권한으로 설정됩니다. 조직의 Google Workspace 정책이 외부 공유를 막고 있으면 관리자 화면에 안내가 표시됩니다. 이 경우 기관의 Google Workspace 관리자에게 해당 Drive 폴더의 외부 보기 공유 허용 여부를 확인해야 합니다.

## 평소 사용 방법

1. 관리자에서 프로그램 제목을 입력합니다.
2. 사진 칸 또는 상세 편집의 사진 칸을 누르고 사진을 선택합니다.
3. `사진을 Google Drive에 저장했습니다` 안내가 나오면 프로그램 **저장**을 누릅니다.
4. 공개 상태로 저장한 프로그램은 공개 목록·상세에 사진과 함께 표시됩니다.

사진 주소를 복사하거나 Google Drive 폴더를 직접 열 필요는 없습니다.

## 현재 단계와 최종 무예산 전환의 차이

현재 자동 업로드 연결은 관리자 서버가 Apps Script에 안전하게 요청하는 중간 단계입니다. 즉, 사진은 Google Drive에 저장되지만 관리자 화면은 아직 현재 웹앱 서버를 사용합니다.

GitHub Pages·Google Apps Script·Google Sheets·Google Drive만으로 운영하려면 다음 단계에서 관리자 인증을 Google 계정 기반으로 바꿔야 합니다. 공개 정적 웹사이트에 업로드 토큰을 넣으면 누구나 토큰을 볼 수 있으므로, 그 방식은 사용하지 않습니다.

## 참고 자료

[Google Apps Script DriveApp](https://developers.google.com/apps-script/reference/drive/drive-app)

[Google Apps Script File 권한 API](https://developers.google.com/apps-script/reference/drive/file)
