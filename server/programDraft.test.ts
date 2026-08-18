import { describe, expect, it } from "vitest";
import { prepareProgramDraft } from "../client/src/lib/programDraft";

describe("프로그램 임시저장", () => {
  it("임시저장은 기존 입력값을 유지하면서 공개 상태만 비공개로 바꾼다", () => {
    expect(prepareProgramDraft({ title: "생활 도자기", imageUrl: "/manus-storage/poster.jpg", isPublished: true })).toEqual({ title: "생활 도자기", imageUrl: "/manus-storage/poster.jpg", isPublished: false });
  });
});
