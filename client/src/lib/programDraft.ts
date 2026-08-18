export function prepareProgramDraft<T extends { isPublished: boolean }>(row: T): T {
  return { ...row, isPublished: false };
}
