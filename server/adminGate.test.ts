import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const caller = appRouter.createCaller({
  user: null,
  req: { headers: {}, protocol: "https" },
  res: {},
} as never);

describe("adminGate.verify", () => {
  it("서버 환경의 관리자 비밀번호로만 진입을 허용한다", async () => {
    const password = process.env.ADMIN_GATE_PASSWORD;
    expect(password).toBeTruthy();
    await expect(caller.adminGate.verify({ password: password! })).resolves.toEqual({ valid: true });
    await expect(caller.adminGate.verify({ password: "invalid-password" })).resolves.toEqual({ valid: false });
  });
});
