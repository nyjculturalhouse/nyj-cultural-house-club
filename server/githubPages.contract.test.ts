import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("GitHub Pages 정적 운영 계약", () => {
  it("공개 프로그램·관리자 화면이 Apps Script API만 호출한다", () => {
    const gas = read("github-pages/assets/gas.js");
    const admin = read("github-pages/admin.html");
    const home = read("github-pages/index.html");
    const programs = read("github-pages/programs.html");
    const mobileProgramGrid = read("github-pages/assets/mobile-program-grid.css");
    expect(gas).toContain("script.google.com/macros");
    expect(admin).toContain("verifyAdminPassword");
    expect(admin).toContain("adminSaveProgram");
    expect(admin).toContain("adminUploadProgramImage");
    expect(home).toContain("home-editorial.css");
    expect(home).toContain("krds-static.css");
    expect(home).toContain("동아리 활동 일정 확인");
    expect(programs).toContain("mobile-program-grid.css");
    expect(mobileProgramGrid).toContain("repeat(2, minmax(0, 1fr))");
  });

  it("GitHub Pages 배포 작업과 정적 빌드가 준비되어 있다", () => {
    const workflow = read(".github/workflows/github-pages.yml");
    const build = read("scripts/build-github-pages.mjs");
    expect(workflow).toContain("actions/configure-pages@v5");
    expect(workflow).toContain("actions/upload-pages-artifact@v4");
    expect(workflow).toContain("actions/deploy-pages@v4");
    expect(workflow).toContain("needs: build");
    expect(build).toContain("dist", "github-pages");
    expect(build).toContain("href=\"/\"");
    expect(build).toContain("krds-static.css");
    expect(build).toContain("const staticBrand");
  });
});
