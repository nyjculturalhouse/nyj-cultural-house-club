import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("정적 출석·대관·일정 화면 계약", () => {
  it("직전 미출석 안내를 모달로 열고 현재 주차 유지 행동을 제공한다", () => {
    const html = read("client/public/attendance.html");
    const script = read("client/public/js/app.js");

    expect(html).toContain('id="previous-week-modal"');
    expect(html).toContain('id="btn-use-previous-week"');
    expect(script).toContain("showPreviousWeekNotice");
    expect(script).toContain("keepSelectedWeek");
  });

  it("대관과 외부활동·일정 화면이 필요한 조회 모드와 상태 메시지를 사용한다", () => {
    const gas = read("google-apps-script/Code.gs");
    const booking = read("client/public/booking.html");
    const calendar = read("client/public/calendar.html");

    expect(gas).toContain('case "getBookings"');
    expect(gas).toContain('case "getActivities"');
    expect(gas).toContain('case "submitBooking"');
    expect(gas).toContain('case "submitExternal"');
    expect(booking).toContain('id="booking-calendar-status"');
    expect(calendar).toContain('id="activity-calendar-status"');
  });
});
