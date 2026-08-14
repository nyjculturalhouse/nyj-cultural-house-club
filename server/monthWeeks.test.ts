import { describe, expect, it } from "vitest";
import { getMonthWeekIndex, getMonthWeeks, getStartedMonthWeeks } from "../client/src/lib/monthWeeks";

describe("월간 출석 주차 계산", () => {
  it("4주만 존재하는 2026년 2월은 1~4주차만 반환한다", () => {
    const weeks = getMonthWeeks(new Date(2026, 1, 1));

    expect(weeks.map((week) => week.index)).toEqual([1, 2, 3, 4]);
    expect(weeks[3]).toMatchObject({ weekStart: "2026-02-22", weekEnd: "2026-02-28" });
  });

  it("달력상 6번째 구간이 생기는 달은 5주차에 합친다", () => {
    const weeks = getMonthWeeks(new Date(2026, 7, 1));

    expect(weeks.map((week) => week.index)).toEqual([1, 2, 3, 4, 5]);
    expect(getMonthWeekIndex(new Date(2026, 7, 31))).toBe(5);
    expect(weeks[4]).toMatchObject({ weekStart: "2026-08-23", weekEnd: "2026-08-31" });
  });

  it("아직 시작하지 않은 미래 주차는 이번 달 활동 목록에서 제외한다", () => {
    const augustWeeks = getMonthWeeks(new Date(2026, 7, 1));
    const startedWeeks = getStartedMonthWeeks(augustWeeks, new Date(2026, 7, 14));

    expect(startedWeeks.map((week) => week.index)).toEqual([1, 2, 3]);
  });
});
