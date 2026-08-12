import { describe, expect, it } from "vitest";
import { normalizeAttendanceStatuses } from "./attendanceStatus";

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
