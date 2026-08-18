import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("관리자 프로그램 등록 화면 계약", () => {
  it("기존 정적 관리자 경로는 시트형 프로그램 관리 화면으로 통합된다", () => {
    const admin = read("client/public/admin.html");
    expect(admin).toContain('http-equiv="refresh" content="0; url=/program-admin"');
    expect(admin).toContain('href="/program-admin"');
    expect(admin).not.toContain("admin-login-modal");
    expect(admin).not.toContain("calendar.google.com");
  });

  it("사진 업로드는 1080×1350의 4:5 세로 비율과 5MB 한도를 안내·검증한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    const styles = read("client/src/index.css");
    expect(page).toContain("가로 1080px · 세로 1350px");
    expect(page).toContain("Math.abs(dimensions.width / dimensions.height - (4 / 5))");
    expect(page).toContain("5 * 1024 * 1024");
    expect(styles).toContain(".program-sheet-image { display: grid; width: 96px; aspect-ratio: 4 / 5;");
    expect(styles).toContain(".program-card__visual { position: relative; aspect-ratio: 4 / 5;");
  });

  it("프로그램 목록·상세의 관리자 진입점이 실제 프로그램 관리 화면으로 통일된다", () => {
    expect(read("client/src/pages/Programs.tsx")).toContain('href="/program-admin"');
    expect(read("client/src/pages/ProgramDetail.tsx")).toContain('href="/program-admin"');
  });

  it("관리자 화면이 행·열 기반 프로그램 시트를 제공한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    expect(page).toContain("프로그램 시트");
    expect(page).toContain("새 프로그램");
    expect(page).toContain("program-compact-table");
    expect(page).toContain("저장하면 프로그램에 연결됩니다.");
  });

  it("관리자 화면이 출석 완료 현황 탭과 저장 전 프로그램 입력 예시 행을 제공한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    expect(page).toContain('attendance.status.useQuery');
    expect(page).toContain('attendance.monthlyStatus.useQuery');
    expect(page).toContain("동아리 출석 확인");
    expect(page).toContain("입력 예시");
    expect(page).toContain("[입력 예시] 주말 생활 도자기");
    expect(page).toContain("programsQuery.data.length === 0 ? [exampleRow()]");
  });

  it("미출석 필터·엑셀 다운로드·선택 행 일괄 저장을 제공한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    expect(page).toContain("onlyUnsubmitted");
    expect(page).toContain("미출석만 보기");
    expect(page).toContain("downloadAttendanceWorkbook");
    expect(page).toContain("선택 항목 저장");
    expect(page).toContain("bulkSave");
    expect(page).toContain("for (const row of targets)");
    expect(page).toContain("const failed: string[]");
    expect(page).toContain("개 행을 저장했지만");
  });

  it("프로그램 입력을 핵심 열 표와 행별 상세 편집으로 나눠 가로 스크롤을 줄인다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    const styles = read("client/src/index.css");
    expect(page).toContain("program-compact-table");
    expect(page).toContain("상세 편집");
    expect(page).toContain("program-detail-editor");
    expect(styles).toContain(".program-compact-table { width: 100%; min-width: 1060px;");
    expect(styles).toContain(".program-compact-table .program-sheet-save { width: 38px; min-width: 38px; padding: 0; }");
    expect(styles).toContain(".program-detail-editor__fields { display: grid; grid-template-columns: repeat(2,minmax(0,1fr));");
  });

  it("관리자 진입 전에 서버 검증 비밀번호를 확인한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    expect(page).toContain("adminGate.verify.useMutation");
    expect(page).toContain("관리자 비밀번호");
    expect(page).toContain("nyj-admin-gate");
  });

  it("프로그램 ID는 한글을 허용하고 문의 전화번호 입력에는 자동 서식을 연결한다", () => {
    const router = read("server/routers.ts");
    const app = read("client/src/App.tsx");
    expect(router).toContain("a-zA-Z0-9가-힣-");
    expect(router).toContain("프로그램 ID는 한글·영문·숫자·하이픈만 사용할 수 있습니다.");
    expect(app).toContain("PhoneNumberAutoFormatter");
  });

  it("참석 인원 통계·등록 완료 모달·상세 입력 선택 안내를 관리자 화면에 연결한다", () => {
    const router = read("server/routers.ts");
    const enhancements = read("client/src/components/AdminProgramEnhancements.tsx");
    expect(router).toContain("headcountSummary");
    expect(enhancements).toContain("누적 참석 인원");
    expect(enhancements).toContain("프로그램 등록 완료");
    expect(enhancements).toContain("상세 입력은 선택");
  });

  it("제목만 입력한 새 프로그램도 ID와 한 줄 소개를 자동 보완해 저장한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    const guidance = read("client/src/components/AdminProgramEnhancements.tsx");
    expect(page).toContain("prepareProgramRowForSave");
    expect(page).toContain("프로그램 제목을 입력해 주세요");
    expect(guidance).toContain("자동 보완");
  });

  it("프로그램을 비공개로 임시저장하고 공개 전 미리보기 모달을 제공한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    const preview = read("client/src/components/ProgramDraftPreviewDialog.tsx");
    expect(page).toContain("saveDraft");
    expect(page).toContain("임시저장");
    expect(page).toContain("ProgramDraftPreviewDialog");
    expect(preview).toContain("공개 전 미리보기");
    expect(preview).toContain("작성으로 돌아가기");
  });
});
