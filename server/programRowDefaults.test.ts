import { describe, expect, it } from "vitest";
import { prepareProgramRowForSave } from "../client/src/lib/programRowDefaults";

describe("프로그램 저장 기본값", () => {
  it("제목만 입력한 새 프로그램의 ID와 한 줄 소개를 자동 생성한다", () => {
    const result = prepareProgramRowForSave({ key: "program-row-1787010000000-ab12", externalId: "", title: "  생활 도자기 수업  ", summary: "" });
    expect(result.externalId).toMatch(/^생활-도자기-수업-1787010000000-ab12$/);
    expect(result.summary).toBe("생활 도자기 수업");
  });

  it("직접 입력한 프로그램 ID와 한 줄 소개는 그대로 유지한다", () => {
    expect(prepareProgramRowForSave({ key: "program-row-1", externalId: "가을-도자기", title: "가을 도자기", summary: "흙으로 만드는 시간" })).toMatchObject({ externalId: "가을-도자기", summary: "흙으로 만드는 시간" });
  });
});
