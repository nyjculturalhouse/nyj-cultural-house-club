import { describe, expect, it } from "vitest";
import { fetchMonthlyAttendanceStatuses } from "./attendanceStatus";

describe("configured Google Apps Script endpoint", () => {
  it("returns a monthly 1~5-week attendance response from GAS_WEB_APP_URL", async () => {
    const today = new Date();
    const result = await fetchMonthlyAttendanceStatuses(today.getFullYear(), today.getMonth() + 1);

    expect(result.source).toBe("monthly");
    expect(result.statuses.length).toBeGreaterThan(0);
    expect(result.statuses[0]?.weeks.length).toBeGreaterThan(0);
    expect(result.statuses[0]?.weeks.every((week) => week.index >= 1 && week.index <= 5)).toBe(true);
  }, 30_000);
});
