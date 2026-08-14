import axios from "axios";
import https from "node:https";

export type AttendanceStatus = {
  club: string;
  lastWeek: boolean;
  thisWeek: boolean;
};

export type MonthlyAttendanceWeek = {
  index: number;
  start: string;
  end: string;
  completed: boolean;
};

export type MonthlyAttendanceStatus = {
  club: string;
  year: number;
  month: number;
  weeks: MonthlyAttendanceWeek[];
};

export type MonthlyAttendanceFetchResult = {
  source: "monthly" | "legacy";
  statuses: MonthlyAttendanceStatus[];
};

const DEFAULT_GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw8TIvA_grDjk0Lu98nSh3gplAUBHezY5rp5ANDlxu4Fk7b2x6VRd0Lbw6wgFNA-NvL9A/exec";
const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL || DEFAULT_GAS_WEB_APP_URL;
const ipv4Agent = new https.Agent({ family: 4, keepAlive: false });

function asCompleted(value: unknown) {
  return value === true || value === "true" || value === "완료";
}

function asIsoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function toIsoDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getMonthWeekIndex(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.min(5, Math.ceil((date.getDate() + firstDay) / 7));
}

export function buildGasUrl(mode: string, parameters: Record<string, string | number> = {}) {
  const url = new URL(GAS_WEB_APP_URL);
  url.searchParams.set("mode", mode);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

export function normalizeAttendanceStatuses(payload: unknown): AttendanceStatus[] {
  if (!Array.isArray(payload)) throw new Error("출석 현황 응답 형식이 올바르지 않습니다.");

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      club: typeof item.club === "string" ? item.club.trim() : "",
      lastWeek: asCompleted(item.lastWeek),
      thisWeek: asCompleted(item.thisWeek),
    }))
    .filter((item) => item.club.length > 0 && item.club !== "동아리명");
}

export function normalizeMonthlyAttendanceStatuses(payload: unknown): MonthlyAttendanceStatus[] {
  if (!Array.isArray(payload)) throw new Error("월간 출석 현황 응답 형식이 올바르지 않습니다.");

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const weeks = Array.isArray(item.weeks) ? item.weeks : [];
      return {
        club: typeof item.club === "string" ? item.club.trim() : "",
        year: typeof item.year === "number" ? item.year : Number(item.year),
        month: typeof item.month === "number" ? item.month : Number(item.month),
        weeks: weeks
          .filter((week): week is Record<string, unknown> => Boolean(week) && typeof week === "object")
          .map((week) => ({
            index: Number(week.index),
            start: asIsoDate(week.start),
            end: asIsoDate(week.end),
            completed: asCompleted(week.completed),
          }))
          .filter((week) => Number.isInteger(week.index) && week.index >= 1 && week.index <= 5 && week.start && week.end)
          .sort((first, second) => first.index - second.index),
      };
    })
    .filter((item) => item.club.length > 0 && item.club !== "동아리명" && Number.isInteger(item.year) && item.month >= 1 && item.month <= 12);
}

async function fetchGasPayload(mode: string, parameters: Record<string, string | number> = {}) {
  const response = await axios.get<unknown>(buildGasUrl(mode, parameters), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; NYJCulturalHouse/1.0)",
    },
    httpsAgent: ipv4Agent,
    timeout: 30_000,
    maxRedirects: 5,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) throw new Error(`출석 현황 조회 실패 (${response.status})`);
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data) && "error" in response.data) {
    throw new Error(typeof response.data.error === "string" ? response.data.error : "출석 현황 조회에 실패했습니다.");
  }
  return response.data;
}

export async function fetchAttendanceStatuses(): Promise<AttendanceStatus[]> {
  return normalizeAttendanceStatuses(await fetchGasPayload("getAttendanceStatus"));
}

function canUseLegacyStatusForMonth(year: number, month: number, date: Date) {
  return year === date.getFullYear() && month === date.getMonth() + 1;
}

export function makeLegacyMonthlyStatuses(statuses: AttendanceStatus[], year: number, month: number, now: Date): MonthlyAttendanceStatus[] {
  const previousWeek = new Date(now);
  previousWeek.setDate(previousWeek.getDate() - 7);

  return statuses.map((status) => {
    const weeks: MonthlyAttendanceWeek[] = [];
    if (canUseLegacyStatusForMonth(year, month, previousWeek)) {
      weeks.push({ index: getMonthWeekIndex(previousWeek), start: toIsoDate(previousWeek), end: toIsoDate(previousWeek), completed: status.lastWeek });
    }
    if (canUseLegacyStatusForMonth(year, month, now)) {
      const currentIndex = getMonthWeekIndex(now);
      const previousIndex = weeks.findIndex((week) => week.index === currentIndex);
      if (previousIndex >= 0) weeks[previousIndex] = { index: currentIndex, start: toIsoDate(now), end: toIsoDate(now), completed: status.thisWeek };
      else weeks.push({ index: currentIndex, start: toIsoDate(now), end: toIsoDate(now), completed: status.thisWeek });
    }
    return { club: status.club, year, month, weeks };
  });
}

export async function fetchMonthlyAttendanceStatuses(year: number, month: number): Promise<MonthlyAttendanceFetchResult> {
  try {
    const payload = await fetchGasPayload("getMonthlyAttendanceStatus", { year, month });
    return { source: "monthly", statuses: normalizeMonthlyAttendanceStatuses(payload) };
  } catch (error) {
    const now = new Date();
    if (!canUseLegacyStatusForMonth(year, month, now) && !canUseLegacyStatusForMonth(year, month, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7))) throw error;
    const statuses = await fetchAttendanceStatuses();
    return { source: "legacy", statuses: makeLegacyMonthlyStatuses(statuses, year, month, now) };
  }
}
