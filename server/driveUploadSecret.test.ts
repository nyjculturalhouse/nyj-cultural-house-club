import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

const caller = appRouter.createCaller({
  user: { id: 1, role: "admin" },
  req: { headers: {}, protocol: "https" },
  res: {},
} as never);

describe("programs.driveUploadStatus", () => {
  it("서버 비밀값으로 Google Drive 자동 업로드가 구성되었음을 확인한다", async () => {
    const status = await caller.programs.driveUploadStatus();
    expect(status.configured).toBe(true);
    expect(status.tokenLength).toBeGreaterThanOrEqual(32);
  });
});
