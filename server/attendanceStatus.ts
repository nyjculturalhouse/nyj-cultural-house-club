export type AttendanceStatus = {
  club: string;
  lastWeek: boolean;
  thisWeek: boolean;
};

const ATTENDANCE_STATUS_URL =
  "https://script.google.com/macros/s/AKfycbw8TIvA_grDjk0Lu98nSh3gplAUBHezY5rp5ANDlxu4Fk7b2x6VRd0Lbw6wgFNA-NvL9A/exec?mode=getAttendanceStatus";

export function normalizeAttendanceStatuses(payload: unknown): AttendanceStatus[] {
  if (!Array.isArray(payload)) {
    throw new Error("출석 현황 응답 형식이 올바르지 않습니다.");
  }

  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      club: typeof item.club === "string" ? item.club.trim() : "",
      lastWeek: item.lastWeek === true || item.lastWeek === "true" || item.lastWeek === "완료",
      thisWeek: item.thisWeek === true || item.thisWeek === "true" || item.thisWeek === "완료",
    }))
    .filter((item) => item.club.length > 0 && item.club !== "동아리명");
}

const ipv4Agent = new https.Agent({ family: 4, keepAlive: false });

export async function fetchAttendanceStatuses(): Promise<AttendanceStatus[]> {
  const response = await axios.get<unknown>(ATTENDANCE_STATUS_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; NYJCulturalHousePreview/1.0)",
    },
    httpsAgent: ipv4Agent,
    timeout: 30_000,
    maxRedirects: 5,
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`출석 현황 조회 실패 (${response.status})`);
  }

  return normalizeAttendanceStatuses(response.data);
}
import axios from "axios";
import https from "node:https";
