import { describe, expect, it } from "vitest";
import { formatKoreanPhone } from "../client/src/lib/phoneFormat";

describe("문의 전화번호 자동 서식", () => {
  it("지역번호 세 자리 전화번호를 000-0000-0000 형식으로 만든다", () => {
    expect(formatKoreanPhone("03112345678")).toBe("031-1234-5678");
    expect(formatKoreanPhone("031-1234-5678")).toBe("031-1234-5678");
  });

  it("서울 지역번호와 입력 중인 번호도 자연스럽게 표시한다", () => {
    expect(formatKoreanPhone("0212345678")).toBe("02-1234-5678");
    expect(formatKoreanPhone("03112")).toBe("031-12");
  });
});
