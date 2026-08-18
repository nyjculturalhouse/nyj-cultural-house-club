export function getDriveUploadToken() {
  return process.env.GAS_DRIVE_UPLOAD_TOKEN?.trim() || "";
}

export function getDriveUploadStatus() {
  const token = getDriveUploadToken();
  return {
    configured: token.length >= 32,
    tokenLength: token.length,
  } as const;
}

export function normalizeDriveUploadResponse(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Google Drive 업로드 응답 형식이 올바르지 않습니다.");
  }

  const value = payload as Record<string, unknown>;
  if (typeof value.error === "string" && value.error.trim()) throw new Error(value.error.trim());
  if (value.ok !== true || typeof value.imageUrl !== "string" || !value.imageUrl.trim()) {
    throw new Error("Google Drive 사진 업로드에 실패했습니다.");
  }
  return {
    key: typeof value.fileId === "string" ? value.fileId : "",
    url: value.imageUrl.trim(),
  } as const;
}
