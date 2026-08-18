import { describe, expect, it } from "vitest";
import { normalizeDriveUploadResponse } from "./driveUpload";

describe("Google Drive 사진 업로드 응답", () => {
  it("공개 이미지 주소를 관리자 업로드 결과로 정규화한다", () => {
    expect(normalizeDriveUploadResponse({ ok: true, fileId: "drive-file-123", imageUrl: "https://drive.google.com/thumbnail?id=drive-file-123&sz=w1600" })).toEqual({
      key: "drive-file-123",
      url: "https://drive.google.com/thumbnail?id=drive-file-123&sz=w1600",
    });
  });

  it("Apps Script 오류 메시지를 관리자 화면으로 전달한다", () => {
    expect(() => normalizeDriveUploadResponse({ error: "Drive 공유 권한을 확인해 주세요." })).toThrow("Drive 공유 권한을 확인해 주세요.");
  });
});
