import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const script = readFileSync(path.join(root, "google-apps-script/Code.gs"), "utf8");

describe("Google Apps Script 배포 코드 계약", () => {
  it("출석·대관·외부활동·프로그램의 공개 조회 모드를 제공한다", () => {
    expect(script).toContain('case "getAttendanceStatus"');
    expect(script).toContain('case "getMonthlyAttendanceStatus"');
    expect(script).toContain('case "getAttendanceHeadcountSummary"');
    expect(script).toContain('case "getBookings"');
    expect(script).toContain('case "getActivities"');
    expect(script).toContain('case "getPrograms"');
    expect(script).toContain('case "health"');
  });

  it("출석·대관·외부활동 등록 모드와 요청 ID 중복 방지를 제공한다", () => {
    expect(script).toContain('case "submitAttendance"');
    expect(script).toContain('case "submitBooking"');
    expect(script).toContain('case "submitExternal"');
    expect(script).toContain("function hasRequestId");
    expect(script).toContain("alreadySubmitted: true");
    expect(script).toContain("LockService.getScriptLock");
  });

  it("관리자 사진을 Google Drive에 자동 저장하고 공개 이미지 주소를 반환한다", () => {
    expect(script).toContain('case "uploadProgramImage"');
    expect(script).toContain("function uploadProgramImage");
    expect(script).toContain("function requireDriveUploadToken");
    expect(script).toContain("GAS_DRIVE_UPLOAD_TOKEN");
    expect(script).toContain("DriveApp.Access.ANYONE_WITH_LINK");
    expect(script).toContain("https://drive.google.com/thumbnail?id=");
    expect(script).toContain("5 * 1024 * 1024");
  });

  it("정적 관리자 화면이 비밀번호 검증 뒤 프로그램·사진을 Google Sheets와 Drive에서 직접 관리할 수 있다", () => {
    expect(script).toContain('case "verifyAdminPassword"');
    expect(script).toContain('case "adminListPrograms"');
    expect(script).toContain('case "adminSaveProgram"');
    expect(script).toContain('case "adminDeleteProgram"');
    expect(script).toContain('case "adminUploadProgramImage"');
    expect(script).toContain("function requireAdminPassword");
    expect(script).toContain("function adminListPrograms");
    expect(script).toContain("function adminSaveProgram");
    expect(script).toContain("function adminDeleteProgram");
    expect(script).toContain("function adminUploadProgramImage");
    expect(script).toContain("function normaliseAdminProgram");
    expect(script).toContain("function makeProgramId");
  });

  it("대관·외부활동의 기존 시트 헤더를 찾아 달력 데이터로 정규화한다", () => {
    expect(script).toContain("function getBookings");
    expect(script).toContain("function getActivities");
    expect(script).toContain("행사시작일시");
    expect(script).toContain("사용일시");
    expect(script).toContain("function initializeSheets");
  });

  it("행사 시작일시가 없는 기존 외부활동 5열 행은 등록일과 레거시 식별자로 표시한다", () => {
    expect(script).toContain('"등록일시", "타임스탬프"');
    expect(script).toContain('"legacy-activity"');
    expect(script).toContain("dateTime: eventStartAt || registeredAt");
  });

  it("datetime-local 형식의 대관·외부활동 일시를 명시적으로 해석한다", () => {
    expect(script).toContain("function parseLocalDateTime");
    expect(script).toContain("[T\\s]");
    expect(script).toContain("new Date(Number(match[1])");
  });

  it("프로그램 시트에서 공개 여부·공식 신청 링크·사진 URL을 포함해 반환한다", () => {
    expect(script).toContain('programs: "프로그램"');
    expect(script).toContain("function getPrograms");
    expect(script).toContain("function isProgramPublished");
    expect(script).toContain("신청 링크");
    expect(script).toContain("사진 URL");
    expect(script).toContain("공개 여부");
  });

  it("출석 인원 열을 기준으로 현재 주·월·연 누적 참석 인원을 계산한다", () => {
    expect(script).toContain("function getAttendanceHeadcountSummary");
    expect(script).toContain("const count = Number(row[2])");
    expect(script).toContain("monthAttendees");
    expect(script).toContain("yearAttendees");
  });
});
