import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const attendanceScript = readFileSync(path.join(projectRoot, "client/public/js/app.js"), "utf8");
const gasCode = readFileSync(path.join(projectRoot, "google-apps-script/Code.gs"), "utf8");

describe("간소화된 출석 흐름 계약", () => {
  it("정적 출석 화면은 회원 이름 대신 출석 인원을 전송하고 직전 미출석을 조회한다", () => {
    expect(attendanceScript).toContain("attendanceCount: count");
    expect(attendanceScript).toContain("findPreviousPendingWeek");
    expect(attendanceScript).toContain("getMonthlyAttendanceStatus");
    expect(attendanceScript).not.toContain("attendees: state.members");
  });

  it("Apps Script는 인원 수 입력과 기존 회원 배열 방식을 모두 수용한다", () => {
    expect(gasCode).toContain("const requestedCount = Number(payload.attendanceCount);");
    expect(gasCode).toContain("const attendanceCount = Number.isInteger(requestedCount) && requestedCount > 0 ? requestedCount : attendees.length;");
    expect(gasCode).toContain("attendees.length ? attendees.join(\", \") : \"인원 수 입력\"");
  });
});
