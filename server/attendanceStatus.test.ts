import { describe, expect, it } from "vitest";
import { buildGasUrl, makeLegacyMonthlyStatuses, normalizeAttendanceStatuses, normalizeMonthlyAttendanceStatuses } from "./attendanceStatus";

describe("normalizeAttendanceStatuses", () => {
  it("헤더 행과 잘못된 값을 제외하고 주차별 완료 상태를 정규화한다", () => {
    const result = normalizeAttendanceStatuses([
      { club: "동아리명", lastWeek: false, thisWeek: false },
      { club: "나래예술단", lastWeek: "완료", thisWeek: "true" },
      { club: "  소리마루  ", lastWeek: false, thisWeek: true },
      null,
    ]);

    expect(result).toEqual([
      { club: "나래예술단", lastWeek: true, thisWeek: true },
      { club: "소리마루", lastWeek: false, thisWeek: true },
    ]);
  });

  it("배열이 아닌 응답은 명확한 오류로 처리한다", () => {
    expect(() => normalizeAttendanceStatuses({ error: "invalid" })).toThrow("출석 현황 응답 형식");
  });
});

describe("normalizeMonthlyAttendanceStatuses", () => {
  it("동아리별 1~5주차 이력을 정규화하고 잘못된 주차는 제외한다", () => {
    const result = normalizeMonthlyAttendanceStatuses([
      {
        club: " 글♥낭 ",
        year: "2026",
        month: "8",
        weeks: [
          { index: 3, start: "2026-08-09", end: "2026-08-15", completed: "true" },
          { index: 1, start: "2026-08-01", end: "2026-08-01", completed: false },
          { index: 6, start: "2026-08-30", end: "2026-08-31", completed: true },
        ],
      },
      { club: "동아리명", year: 2026, month: 8, weeks: [] },
    ]);

    expect(result).toEqual([
      {
        club: "글♥낭",
        year: 2026,
        month: 8,
        weeks: [
          { index: 1, start: "2026-08-01", end: "2026-08-01", completed: false },
          { index: 3, start: "2026-08-09", end: "2026-08-15", completed: true },
        ],
      },
    ]);
  });

  it("월간 응답이 배열이 아니면 명확한 오류로 처리한다", () => {
    expect(() => normalizeMonthlyAttendanceStatuses({ error: "invalid" })).toThrow("월간 출석 현황 응답 형식");
  });
});

describe("buildGasUrl", () => {
  it("모드와 월간 조회 파라미터를 GAS 웹앱 URL에 안전하게 추가한다", () => {
    const url = new URL(buildGasUrl("getMonthlyAttendanceStatus", { year: 2026, month: 8 }));
    expect(url.searchParams.get("mode")).toBe("getMonthlyAttendanceStatus");
    expect(url.searchParams.get("year")).toBe("2026");
    expect(url.searchParams.get("month")).toBe("8");
  });
});

describe("makeLegacyMonthlyStatuses", () => {
  it("월간 엔드포인트가 배포되기 전 현재·직전 주차만 대기 상태용 월간 응답으로 변환한다", () => {
    const result = makeLegacyMonthlyStatuses(
      [{ club: "글♥낭", lastWeek: true, thisWeek: false }],
      2026,
      8,
      new Date(2026, 7, 13),
    );

    expect(result).toEqual([
      {
        club: "글♥낭",
        year: 2026,
        month: 8,
        weeks: [
          { index: 2, start: "2026-08-06", end: "2026-08-06", completed: true },
          { index: 3, start: "2026-08-13", end: "2026-08-13", completed: false },
        ],
      },
    ]);
  });
});
