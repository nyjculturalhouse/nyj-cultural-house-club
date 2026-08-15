import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("관리자 프로그램 등록 화면 계약", () => {
  it("기존 정적 관리자 경로는 시트형 프로그램 관리 화면으로 통합된다", () => {
    const admin = read("client/public/admin.html");
    expect(admin).toContain('http-equiv="refresh" content="0; url=/program-admin"');
    expect(admin).toContain('href="/program-admin"');
    expect(admin).not.toContain("admin-login-modal");
    expect(admin).not.toContain("calendar.google.com");
  });

  it("사진 업로드는 1080×1350의 4:5 세로 비율과 5MB 한도를 안내·검증한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    const styles = read("client/src/index.css");
    expect(page).toContain("1080×1350px(4:5)");
    expect(page).toContain("Math.abs(dimensions.width / dimensions.height - (4 / 5))");
    expect(page).toContain("5 * 1024 * 1024");
    expect(styles).toContain(".program-sheet-image { display: grid; width: 96px; aspect-ratio: 4 / 5;");
    expect(styles).toContain(".program-card__visual { position: relative; aspect-ratio: 4 / 5;");
  });

  it("프로그램 목록·상세의 관리자 진입점이 실제 프로그램 관리 화면으로 통일된다", () => {
    expect(read("client/src/pages/Programs.tsx")).toContain('href="/program-admin"');
    expect(read("client/src/pages/ProgramDetail.tsx")).toContain('href="/program-admin"');
  });

  it("관리자 화면이 행·열 기반 프로그램 시트를 제공한다", () => {
    const page = read("client/src/pages/ProgramAdmin.tsx");
    expect(page).toContain("프로그램 시트");
    expect(page).toContain("새 행 추가");
    expect(page).toContain("program-sheet");
    expect(page).toContain("해당 행의 저장 버튼");
  });
});
