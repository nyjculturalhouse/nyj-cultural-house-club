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
    expect(script).toContain("window.KRDSModal.open('previous-week-modal')");
    expect(script).toContain("window.KRDSModal.close('previous-week-modal')");
    expect(script).toContain("keepSelectedWeek");
    expect(script).toContain("getAttendanceDateLabel");
    expect(script).toContain("출석체크가 아직 등록되지 않았습니다.");
    expect(script).toContain("출석 날짜를 선택하세요");
    expect(html).toContain("선택한 출석 날짜");
    expect(html).toContain('id="previous-week-modal-help"');
    expect(script).toContain("pendingDateLabel");
    expect(html).toContain('css/style.css?v=20260815-step-typography');
    expect(html).toContain('js/app.js?v=20260814-date-attendance');
    expect(html).toContain('class="attendance-step-heading"');
    expect(read("client/public/css/monochrome.css")).toContain('.step-indicator li[aria-current="step"] .step-num { display: none !important; }');
    expect(read("client/public/css/monochrome.css")).toContain('.attendance-step-heading');
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

  it("공간 이용 예약은 남양주문화재단으로 연결하고 대관 확인은 캘린더 탭을 직접 연다", () => {
    const home = read("client/src/pages/Home.tsx");
    const booking = read("client/public/booking.html");

    expect(home).toContain('href="https://www.nyjcf.or.kr/www/114"');
    expect(home).toContain('href="/booking.html?tab=calendar"');
    expect(home).toContain('>대관 확인<');
    expect(booking).toContain("new URLSearchParams(window.location.search).get('tab')");
    expect(booking).toContain("showBookingTab(requestedBookingTab)");
  });

  it("출석과 일정의 우선 상호작용 요소를 무라운드 경계·딤드 계층으로 구분한다", () => {
    const attendance = read("client/public/attendance.html");
    const calendar = read("client/public/calendar.html");
    const styles = read("client/public/css/monochrome.css");

    expect(attendance).toContain('id="result-modal-panel"');
    expect(attendance).toContain('id="previous-week-modal-panel"');
    expect(calendar).toContain('class="calendar-surface');
    expect(calendar).toContain('class="activity-modal-meta__row');
    expect(styles).toContain('body * { border-radius: 0 !important; box-shadow: none !important; }');
    expect(styles).toContain('.modal-backdrop .modal-panel::before');
    expect(styles).toContain('.calendar-surface .fc-event');
  });

  it("대관과 외부활동 일정에 로딩·빈 상태·오류 상태를 한국어로 제공한다", () => {
    const booking = read("client/public/booking.html");
    const calendar = read("client/public/calendar.html");
    const styles = read("client/public/css/monochrome.css");

    expect(booking).toContain("대관 일정 정보를 불러오는 중입니다.");
    expect(booking).toContain("대관 일정 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
    expect(calendar).toContain("외부활동 일정 정보를 불러오는 중입니다.");
    expect(calendar).toContain("외부활동 일정 데이터를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
    expect(styles).toContain('[data-state="loading"]');
    expect(styles).toContain('[data-state="error"]');
  });

  it("모든 정적 하위 화면의 홈 링크가 존재하지 않는 index.html 대신 루트 메인으로 이동한다", () => {
    ["attendance.html", "booking.html", "calendar.html", "external.html", "admin.html"].forEach((file) => {
      const html = read(`client/public/${file}`);
      expect(html).toContain('href="/"');
      expect(html).not.toContain('href="index.html"');
    });
  });

  it("메인은 핵심 서비스와 세 가지 운영 바로가기만 유지하고 출석부 카드는 호버 시에만 반전한다", () => {
    const home = read("client/src/pages/Home.tsx");
    const styles = read("client/src/index.css");

    expect(home).toContain("동아리 활동을 위한");
    expect(home).toContain('href="/admin.html"');
    expect(home).toContain("동아리 활동을 위한 모든 시작점</h2>");
    expect(home).toContain("남양주문화재단");
    expect(home).toContain("동아리 활동 일정 확인");
    expect(home).toContain(">대관 확인<");
    expect(home).not.toContain("함께 만드는");
    expect(home).not.toContain("reference-hero");
    expect(home).not.toContain("program-spotlight");
    expect(home).not.toContain("reference-service--active");
    expect(home).toContain('className="reference-service__action-spacer"');
    expect(home).toContain("출석 현황을 빠르게 기록하세요.");
    expect(home).toContain("문화재단 공간을 예약하세요.");
    expect(home).toContain("동아리 활동을 공유하세요.");
    expect(home).toContain("프로그램 소식을 확인하세요.");
    expect(styles).toContain(".reference-service:hover { color: #fff; background: #000; }");
    expect(styles).toContain(".reference-service__action-spacer { display: block; height: 24px; }");
    expect(styles).toContain(".reference-service { min-height: 184px; padding: 15px 16px; }");
    expect(styles).not.toContain(".reference-service--active { color: #fff; background: #000; }");
  });
});
