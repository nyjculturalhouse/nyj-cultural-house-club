# GitHub·Google만으로 운영하는 목표 구조

## 목표

전환이 완료되면 다음 네 가지 서비스만 사용합니다.

| 역할 | 서비스 | 운영자가 하는 일 |
|---|---|---|
| 공개 웹사이트 | GitHub Pages | GitHub에 코드 반영 시 자동 배포 |
| 출석·대관·프로그램 API | Google Apps Script | 프로그램·출석 데이터를 Sheets에 기록 |
| 데이터 | Google Sheets | 프로그램, 출석, 대관, 외부활동 확인 |
| 사진 | Google Drive | 관리자 사진 선택 시 Apps Script가 자동 저장 |

## 관리자 안전성

공개 사이트의 읽기 API와 관리자 쓰기 API는 분리합니다.

| 구분 | 접근 방식 | 이유 |
|---|---|---|
| 공개 목록·출석 조회 | 누구나 가능한 읽기 전용 Apps Script API | 이용자가 로그인하지 않아도 콘텐츠 확인 가능 |
| 관리자 사진 업로드·프로그램 저장 | Google 계정 로그인 기반 관리자 화면 또는 기관 계정만 허용한 Apps Script 웹앱 | 정적 JavaScript에 비밀번호·토큰을 넣지 않기 위해 |

> GitHub Pages는 정적 웹사이트이므로, 브라우저에 업로드 비밀값을 넣는 방식은 안전하지 않습니다. 최종 전환에서는 관리자가 Google 계정으로 로그인한 상태에서만 사진을 올리고 프로그램을 저장하도록 구성합니다.

## 전환 순서

1. 현재 프로그램·출석 데이터를 Google Sheets로 정리합니다.
2. 현재 자동 Drive 업로드 API를 Apps Script에서 검증합니다.
3. 공개 React 화면을 GitHub Pages 배포 경로로 빌드합니다.
4. 관리자 기능은 Google 계정 기반 관리자 페이지로 연결합니다.
5. GitHub Pages 공개 화면, Apps Script API, Sheets 기록, Drive 사진 표시를 함께 검증합니다.
6. 모든 공개·관리자 흐름이 확인된 뒤 현재 서버 의존성을 제거합니다.

## 운영 결과

전환 완료 뒤에는 월별 서버·사진 저장 비용 없이 GitHub·Google 서비스의 무료 범위 안에서 운영할 수 있습니다. 다만 Google Workspace의 Drive 외부 공유 정책과 Apps Script 쿼터는 기관 계정 정책에 따라 확인해야 합니다.
