import axios from "axios";
import https from "node:https";
import { eq } from "drizzle-orm";
import { programs } from "../drizzle/schema";
import { getDb } from "./db";
import { buildGasUrl } from "./attendanceStatus";
import { getDriveUploadToken, normalizeDriveUploadResponse } from "./driveUpload";

export const PROGRAM_STATUSES = ["upcoming", "open", "closing-soon", "closed"] as const;
export const APPLICATION_PROVIDERS = ["nyjcf", "naver", "other", "none"] as const;

export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];
export type ApplicationProvider = (typeof APPLICATION_PROVIDERS)[number];

export type PublicProgram = {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  target: string;
  venue: string;
  startAt: string | null;
  endAt: string | null;
  recruitmentDeadline: string | null;
  recruitmentStatus: ProgramStatus;
  applicationUrl: string;
  applicationProvider: ApplicationProvider;
  contact: string;
  preApplicationChecks: string[];
  imageUrl: string;
};

export type ProgramFilters = {
  category?: string;
  target?: string;
  status?: ProgramStatus;
};

export type ProgramsFeed = {
  source: "google-sheet" | "database";
  items: PublicProgram[];
};

export type ProgramManagementInput = {
  externalId: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  target: string;
  venue: string;
  startAt: string | null;
  endAt: string | null;
  recruitmentDeadline: string | null;
  recruitmentStatus: ProgramStatus;
  applicationUrl: string;
  applicationProvider: ApplicationProvider;
  contact: string;
  preApplicationChecks: string;
  imageUrl: string;
  isPublished: boolean;
};

const ipv4Agent = new https.Agent({ family: 4, keepAlive: false });

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function asIsoDateTime(value: unknown) {
  const text = asText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : text;
}

function asBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value;
  const normalized = asText(value).toLowerCase();
  if (["true", "1", "yes", "y", "공개", "게시"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "비공개", "미게시"].includes(normalized)) return false;
  return fallback;
}

function toStatus(value: unknown): ProgramStatus {
  const normalized = asText(value).toLowerCase();
  if (["upcoming", "예정"].includes(normalized)) return "upcoming";
  if (["closing-soon", "closing", "마감임박", "마감 임박"].includes(normalized)) return "closing-soon";
  if (["closed", "마감", "종료"].includes(normalized)) return "closed";
  return "open";
}

function toProvider(value: unknown, applicationUrl: string): ApplicationProvider {
  const normalized = asText(value).toLowerCase();
  if (APPLICATION_PROVIDERS.includes(normalized as ApplicationProvider)) return normalized as ApplicationProvider;
  if (applicationUrl.includes("nyjcf.or.kr")) return "nyjcf";
  if (applicationUrl.includes("naver.com")) return "naver";
  return applicationUrl ? "other" : "none";
}

function splitChecks(value: unknown) {
  return asText(value)
    .split(/\r?\n|\||;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveRecruitmentStatus(status: ProgramStatus, deadline: string | null, now = new Date()): ProgramStatus {
  if (status === "closed") return "closed";
  if (status === "upcoming") return "upcoming";
  if (!deadline) return status;

  const deadlineAt = new Date(deadline);
  if (Number.isNaN(deadlineAt.getTime())) return status;
  if (deadlineAt.getTime() < now.getTime()) return "closed";
  const withinThreeDays = deadlineAt.getTime() - now.getTime() <= 72 * 60 * 60 * 1000;
  return withinThreeDays ? "closing-soon" : status;
}

function normalizeProgram(raw: Record<string, unknown>, now = new Date()): PublicProgram | null {
  const id = asText(raw.externalId ?? raw.programId ?? raw.id ?? raw["프로그램ID"]);
  const title = asText(raw.title ?? raw["제목"]);
  const summary = asText(raw.summary ?? raw["한줄소개"] ?? raw["한 줄 소개"]);
  const applicationUrl = asText(raw.applicationUrl ?? raw["신청링크"] ?? raw["공식신청URL"]);
  if (!id || !title || !summary) return null;

  const deadline = asIsoDateTime(raw.recruitmentDeadline ?? raw["모집마감일"] ?? raw["마감일"]);
  const requestedStatus = toStatus(raw.recruitmentStatus ?? raw["모집상태"]);
  return {
    id,
    title,
    summary,
    description: asText(raw.description ?? raw["상세소개"] ?? raw["상세 소개"]),
    category: asText(raw.category ?? raw["주제"]),
    target: asText(raw.target ?? raw["대상"]),
    venue: asText(raw.venue ?? raw["장소"]),
    startAt: asIsoDateTime(raw.startAt ?? raw["시작일시"] ?? raw["시작 일시"]),
    endAt: asIsoDateTime(raw.endAt ?? raw["종료일시"] ?? raw["종료 일시"]),
    recruitmentDeadline: deadline,
    recruitmentStatus: resolveRecruitmentStatus(requestedStatus, deadline, now),
    applicationUrl,
    applicationProvider: toProvider(raw.applicationProvider ?? raw["신청처"], applicationUrl),
    contact: asText(raw.contact ?? raw["문의처"]),
    preApplicationChecks: splitChecks(raw.preApplicationChecks ?? raw["신청전확인"] ?? raw["신청 전 확인"]),
    imageUrl: asText(raw.imageUrl ?? raw["사진URL"] ?? raw["사진 URL"]),
  };
}

function matchesFilters(item: PublicProgram, filters: ProgramFilters) {
  if (filters.category && item.category !== filters.category) return false;
  if (filters.target && item.target !== filters.target) return false;
  if (filters.status && item.recruitmentStatus !== filters.status) return false;
  return true;
}

function chronological(first: PublicProgram, second: PublicProgram) {
  const firstAt = first.startAt ? new Date(first.startAt).getTime() : Number.MAX_SAFE_INTEGER;
  const secondAt = second.startAt ? new Date(second.startAt).getTime() : Number.MAX_SAFE_INTEGER;
  return firstAt - secondAt || first.title.localeCompare(second.title, "ko");
}

async function getSheetPrograms(now: Date): Promise<PublicProgram[]> {
  const response = await axios.get<unknown>(buildGasUrl("getPrograms"), {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; NYJCulturalHouse/1.0)" },
    httpsAgent: ipv4Agent,
    timeout: 30_000,
    maxRedirects: 5,
    validateStatus: () => true,
  });
  if (response.status < 200 || response.status >= 300) throw new Error(`프로그램 조회 실패 (${response.status})`);
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data) && "error" in response.data) throw new Error("프로그램 Google Sheet 연동이 아직 준비되지 않았습니다.");
  if (!Array.isArray(response.data)) throw new Error("프로그램 응답 형식이 올바르지 않습니다.");

  return response.data
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .filter((item) => asBoolean(item.isPublished ?? item["공개여부"], true))
    .map((item) => normalizeProgram(item, now))
    .filter((item): item is PublicProgram => Boolean(item));
}

async function getDatabasePrograms(now: Date): Promise<PublicProgram[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(programs).where(eq(programs.isPublished, true));
  return rows
    .map((row) => normalizeProgram({ ...row, externalId: row.externalId, startAt: row.startAt?.toISOString(), endAt: row.endAt?.toISOString(), recruitmentDeadline: row.recruitmentDeadline?.toISOString() }, now))
    .filter((item): item is PublicProgram => Boolean(item));
}

export function mergeProgramFeeds(databaseItems: PublicProgram[], sheetItems: PublicProgram[]) {
  const merged = new Map(databaseItems.map(item => [item.id, item]));
  sheetItems.forEach(item => merged.set(item.id, item));
  return Array.from(merged.values());
}

export async function listPrograms(filters: ProgramFilters = {}, now = new Date()): Promise<ProgramsFeed> {
  const databaseItems = await getDatabasePrograms(now);
  try {
    const sheetItems = await getSheetPrograms(now);
    const items = mergeProgramFeeds(databaseItems, sheetItems);
    return { source: "google-sheet", items: items.filter((item) => matchesFilters(item, filters)).sort(chronological) };
  } catch (error) {
    console.info("[Programs] Google Sheet feed unavailable; using the verified database fallback.", error instanceof Error ? error.message : error);
    return { source: "database", items: databaseItems.filter((item) => matchesFilters(item, filters)).sort(chronological) };
  }
}

function toDatabaseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("날짜 형식이 올바르지 않습니다.");
  return parsed;
}

export async function listManagedPrograms() {
  const db = await getDb();
  if (!db) throw new Error("프로그램 관리 데이터베이스에 연결할 수 없습니다.");
  const rows = await db.select().from(programs);
  return rows
    .sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime())
    .map(row => ({
      externalId: row.externalId,
      title: row.title,
      summary: row.summary,
      description: row.description ?? "",
      category: row.category ?? "",
      target: row.target ?? "",
      venue: row.venue ?? "",
      startAt: row.startAt?.toISOString() ?? null,
      endAt: row.endAt?.toISOString() ?? null,
      recruitmentDeadline: row.recruitmentDeadline?.toISOString() ?? null,
      recruitmentStatus: row.recruitmentStatus as ProgramStatus,
      applicationUrl: row.applicationUrl ?? "",
      applicationProvider: row.applicationProvider as ApplicationProvider,
      contact: row.contact ?? "",
      preApplicationChecks: row.preApplicationChecks ?? "",
      imageUrl: row.imageUrl ?? "",
      isPublished: row.isPublished,
      updatedAt: row.updatedAt.toISOString(),
    }));
}

export async function saveManagedProgram(input: ProgramManagementInput) {
  const db = await getDb();
  if (!db) throw new Error("프로그램 관리 데이터베이스에 연결할 수 없습니다.");

  const values = {
    externalId: input.externalId,
    title: input.title,
    summary: input.summary,
    description: input.description || null,
    category: input.category || null,
    target: input.target || null,
    venue: input.venue || null,
    startAt: toDatabaseDate(input.startAt),
    endAt: toDatabaseDate(input.endAt),
    recruitmentDeadline: toDatabaseDate(input.recruitmentDeadline),
    recruitmentStatus: input.recruitmentStatus,
    applicationUrl: input.applicationUrl || null,
    applicationProvider: input.applicationProvider,
    contact: input.contact || null,
    preApplicationChecks: input.preApplicationChecks || null,
    imageUrl: input.imageUrl || null,
    isPublished: input.isPublished,
    sourceUpdatedAt: new Date(),
  };
  const existing = await db.select({ id: programs.id }).from(programs).where(eq(programs.externalId, input.externalId)).limit(1);

  if (existing.length) {
    await db.update(programs).set(values).where(eq(programs.externalId, input.externalId));
  } else {
    await db.insert(programs).values(values);
  }

  return { externalId: input.externalId, created: !existing.length };
}

export async function deleteManagedProgram(externalId: string) {
  const db = await getDb();
  if (!db) throw new Error("프로그램 관리 데이터베이스에 연결할 수 없습니다.");
  await db.delete(programs).where(eq(programs.externalId, externalId));
  return { externalId };
}

export function decodeProgramImage(dataUrl: string, contentType: string) {
  if (!contentType.startsWith("image/")) throw new Error("이미지 파일만 업로드할 수 있습니다.");
  const base64 = dataUrl.includes(",") ? dataUrl.slice(dataUrl.indexOf(",") + 1) : dataUrl;
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length) throw new Error("사진 파일을 읽을 수 없습니다.");
  if (bytes.length > 5 * 1024 * 1024) throw new Error("사진은 5MB 이하만 업로드할 수 있습니다.");
  return bytes;
}

export async function uploadManagedProgramImage(input: { fileName: string; contentType: string; dataUrl: string }) {
  decodeProgramImage(input.dataUrl, input.contentType);
  const uploadToken = getDriveUploadToken();
  if (uploadToken.length < 32) throw new Error("Google Drive 자동 업로드 설정이 아직 완료되지 않았습니다.");

  try {
    const response = await axios.post(
      buildGasUrl("uploadProgramImage"),
      JSON.stringify({
        mode: "uploadProgramImage",
        uploadToken,
        fileName: input.fileName,
        contentType: input.contentType,
        dataUrl: input.dataUrl,
      }),
      {
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        httpsAgent: ipv4Agent,
        maxBodyLength: 8 * 1024 * 1024,
        maxContentLength: 8 * 1024 * 1024,
      },
    );
    const payload = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
    return normalizeDriveUploadResponse(payload);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Google Drive 사진 업로드에 실패했습니다.");
  }
}

export async function getProgramById(id: string, now = new Date()) {
  const feed = await listPrograms({}, now);
  return { source: feed.source, item: feed.items.find((item) => item.id === id) ?? null };
}

function toIcsDate(value: string) {
  const normalized = value.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace(/Z$/, "");
  if (/^\d{8}$/.test(normalized)) return `${normalized}T000000`;
  return normalized.length >= 15 ? normalized.slice(0, 15) : "";
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function buildProgramIcs(item: PublicProgram) {
  if (!item.startAt) throw new Error("일정 시작 일시가 없어 캘린더 파일을 만들 수 없습니다.");
  const start = toIcsDate(item.startAt);
  const end = item.endAt ? toIcsDate(item.endAt) : start;
  const description = [item.summary, item.description, item.contact ? `문의: ${item.contact}` : ""].filter(Boolean).join("\n\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NamYangJu Cultural House//Programs//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:nyj-cultural-house-${escapeIcs(item.id)}@programs`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}Z`,
    `DTSTART;TZID=Asia/Seoul:${start}`,
    `DTEND;TZID=Asia/Seoul:${end}`,
    `SUMMARY:${escapeIcs(item.title)}`,
    `LOCATION:${escapeIcs(item.venue)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
