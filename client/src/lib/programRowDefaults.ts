type ProgramIdentity = {
  key: string;
  externalId: string;
  title: string;
  summary: string;
};

function makeAutomaticId(title: string, key: string) {
  const readableTitle = title
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
  const suffix = key.replace(/^program-row-/, "").replace(/[^a-zA-Z0-9-]/g, "").slice(-18);
  return `${readableTitle || "프로그램"}-${suffix}`.slice(0, 128);
}

export function prepareProgramRowForSave<T extends ProgramIdentity>(row: T): T {
  const title = row.title.trim();
  const externalId = row.externalId.trim() || (title ? makeAutomaticId(title, row.key) : "");
  return { ...row, externalId, title, summary: row.summary.trim() || title };
}
