import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const appSource = readFileSync(path.join(projectRoot, "client/src/App.tsx"), "utf8");
const monthlyPageSource = readFileSync(path.join(projectRoot, "client/src/pages/MonthlyAttendance.tsx"), "utf8");

describe("월간 출석 전용 화면 경로", () => {
  it("메인 간소화 여부와 무관하게 라우터가 월간 출석 전용 화면을 직접 제공한다", () => {
    expect(appSource).toContain('path={"/monthly-attendance"}');
    expect(monthlyPageSource).toContain("동아리별 출석 확인");
    expect(monthlyPageSource).toContain('href="/"');
  });
});
