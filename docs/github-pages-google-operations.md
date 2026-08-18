# GitHub Pages·Google 운영 절차

이 문서는 남양주시 문화의집 동아리 시스템을 **GitHub Pages, Google Apps Script, Google Sheets, Google Drive**만으로 운영하기 위한 실제 전환 절차입니다. 공개 홈페이지와 관리 화면은 GitHub Pages에서 제공하고, 데이터와 사진은 기존 Apps Script 소유 Google 계정의 Sheets·Drive에 남습니다.

## 1. Apps Script 업데이트 및 권한 설정

기존 Apps Script 프로젝트에서 `google-apps-script/Code.gs`의 전체 내용을 현재 저장소 파일로 교체합니다. 이후 Apps Script 편집기에서 **프로젝트 설정 → 스크립트 속성**을 열고 아래 두 값을 추가합니다.

| 속성 이름 | 입력할 값 | 용도 |
|---|---|---|
| `ADMIN_GATE_PASSWORD` | 관리자 비밀번호 | 정적 관리자 페이지 접속 검증 |
| `GAS_DRIVE_UPLOAD_TOKEN` | 별도로 보관한 64자리 업로드 토큰 | Drive 사진 업로드 요청 검증 |

> 업로드 토큰은 공개 GitHub 저장소, HTML 파일, Google Sheet 셀에 기록하지 않습니다. Apps Script의 스크립트 속성에만 보관합니다.

속성을 저장한 뒤 Apps Script 상단의 함수 목록에서 `initializeSheets`를 선택해 한 번 실행합니다. 처음 실행할 때는 Sheets·Drive 권한을 요청하므로 기존 Apps Script 소유 Google 계정으로 승인합니다. 이 과정은 프로그램 시트의 필요한 열을 준비하며, 사진 폴더는 첫 사진 업로드 때 Drive에 자동 생성됩니다.

## 2. 웹 앱 새 버전 배포

Apps Script에서 **배포 → 배포 관리 → 연필 아이콘 → 새 버전**을 선택합니다. 실행 계정은 기존 Apps Script 소유 계정으로 유지하고, 접근 권한은 공개 이용자가 조회·출석 등록을 할 수 있도록 기존 운영 설정과 동일하게 둡니다. 배포를 업데이트한 뒤 기존 `/exec` 주소가 계속 유지되는지 확인합니다.

브라우저에서 아래처럼 동작을 확인합니다.

| 확인 항목 | 기대 결과 |
|---|---|
| 프로그램 목록 조회 | 공개 프로그램만 반환 |
| 관리자 비밀번호 검증 | 올바른 비밀번호에서 관리자 화면 진입 |
| 사진 업로드 | 5MB 이하 JPG·PNG·WEBP가 Drive 폴더에 저장되고 URL 반환 |
| 공개 프로그램 저장 | Google Sheet 프로그램 행이 갱신되고 목록에 표시 |

## 3. GitHub Pages 활성화

저장소의 `main` 브랜치에 최신 변경이 올라간 뒤 GitHub 저장소에서 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 선택합니다. 이후 `main`에 변경을 올릴 때마다 `GitHub Pages 배포` 작업이 자동 실행됩니다.

배포 작업이 완료되면 기본 주소는 다음과 같습니다.

> `https://nyjculturalhouse.github.io/nyj-cultural-house-club/`

관리자 화면은 아래 주소를 사용합니다.

> `https://nyjculturalhouse.github.io/nyj-cultural-house-club/admin.html`

정적 빌드 단계는 저장소 하위 주소에서도 모든 기존 화면이 유지되도록 홈 링크를 `./index.html`로 바꿉니다. 따라서 출석·대관·일정·외부활동 페이지에서 홈 아이콘을 눌러도 GitHub 사용자 루트가 아니라 문화의집 홈페이지로 돌아옵니다.

## 4. 프로그램 사진 운영 원칙

관리자 화면에서 1080×1350px, 5MB 이하의 JPG·PNG·WEBP 사진을 선택하면 Apps Script가 `남양주시 문화의집 프로그램 사진` 폴더를 만들거나 재사용해 파일을 저장합니다. 저장된 파일은 **링크가 있는 모든 사용자에게 보기 허용** 권한으로 전환되고, 공개 프로그램의 대표 사진으로 쓰일 수 있는 URL이 반환됩니다.

사진을 교체할 때 기존 Drive 파일은 자동으로 삭제하지 않습니다. 필요하지 않은 사진은 Drive 폴더에서 담당자가 직접 삭제합니다. 공개 프로그램에 연결된 사진을 삭제하면 홈페이지에서 이미지가 보이지 않을 수 있으므로, 먼저 관리자에서 새 사진으로 저장한 뒤 이전 파일을 정리합니다.

## 5. 역할과 데이터 흐름

| 구분 | 담당 시스템 | 접근 방식 |
|---|---|---|
| 공개 홈페이지 | GitHub Pages | 누구나 조회·출석·일정 확인 |
| 관리자 프로그램 편집 | GitHub Pages `admin.html` | 관리자 비밀번호를 Apps Script에서 확인 |
| 출석·프로그램 데이터 | Google Sheets | Apps Script만 읽기·쓰기 |
| 프로그램 사진 | Google Drive | Apps Script만 업로드·공개 URL 생성 |
| 권한·배포 관리 | 기존 Apps Script 소유 Google 계정 | Sheets·Drive 소유 및 Apps Script 배포 |

GitHub Pages에는 Google 로그인 세션이나 Drive 업로드 토큰을 넣지 않습니다. 이 구성에서는 관리자 화면의 비밀번호 확인과 모든 쓰기 요청 검증이 Apps Script에서 이루어지므로, 공개 웹사이트가 같은 Sheets·Drive를 사용하면서도 데이터 원본과 업로드 토큰은 Google 계정 아래에 유지됩니다.
