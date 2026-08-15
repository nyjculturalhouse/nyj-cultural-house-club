import { describe, expect, it } from "vitest";
import { buildAttendanceWorkbook } from "../client/src/lib/attendanceExport";

describe("출석 엑셀 내보내기", () => {
  it("동아리별 주간 상태와 월간 주차 기록을 별도 시트로 구성한다", () => {
    const workbook = buildAttendanceWorkbook(
      [{ club: "검증동아리", lastWeek: true, thisWeek: false }],
      [{ club: "검증동아리", weeks: [{ index: 1, start: "2026-08-01", end: "2026-08-07", completed: true }] }],
      new Date("2026-08-15T00:00:00Z"),
    );
    expect(workbook.SheetNames).toEqual(["출석 현황", "월간 출석"]);
    expect(workbook.Sheets["출석 현황"]?.A5?.v).toBe("검증동아리");
    expect(workbook.Sheets["출석 현황"]?.D5?.v).toBe("출석 등록 필요");
    expect(workbook.Sheets["월간 출석"]?.E3?.v).toBe("완료");
  });
});
