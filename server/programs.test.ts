import { describe, expect, it } from "vitest";
import { buildProgramIcs, resolveRecruitmentStatus, type PublicProgram } from "./programs";

const sampleProgram: PublicProgram = {
  id: "culture-2026-01",
  title: "문화 프로그램, 안내",
  summary: "프로그램 안내 문구입니다.",
  description: "준비물: 필기도구",
  category: "문화예술",
  target: "성인",
  venue: "남양주시 문화의집",
  startAt: "2026-08-19T14:00:00",
  endAt: "2026-08-19T16:00:00",
  recruitmentDeadline: "2026-08-18T23:59:00",
  recruitmentStatus: "open",
  applicationUrl: "https://www.nyjcf.or.kr/www/114",
  applicationProvider: "nyjcf",
  contact: "문화의집 담당자",
  preApplicationChecks: ["일정 확인", "준비물 확인"],
  imageUrl: "",
};

describe("resolveRecruitmentStatus", () => {
  it("마감일이 지난 모집 중 프로그램을 자동으로 모집 마감으로 전환한다", () => {
    expect(resolveRecruitmentStatus("open", "2026-08-10T23:59:00", new Date("2026-08-15T00:00:00"))).toBe("closed");
  });

  it("마감 72시간 전의 모집 중 프로그램을 마감 임박으로 표시한다", () => {
    expect(resolveRecruitmentStatus("open", "2026-08-17T12:00:00", new Date("2026-08-15T12:00:00"))).toBe("closing-soon");
  });

  it("예정과 명시적 모집 마감 상태는 마감일과 무관하게 유지한다", () => {
    const now = new Date("2026-08-15T00:00:00");
    expect(resolveRecruitmentStatus("upcoming", "2026-08-10T23:59:00", now)).toBe("upcoming");
    expect(resolveRecruitmentStatus("closed", "2026-08-20T23:59:00", now)).toBe("closed");
  });
});

describe("buildProgramIcs", () => {
  it("한국 표준시 일정과 특수 문자가 이스케이프된 캘린더 파일을 생성한다", () => {
    const content = buildProgramIcs(sampleProgram);
    expect(content).toContain("BEGIN:VCALENDAR");
    expect(content).toContain("UID:nyj-cultural-house-culture-2026-01@programs");
    expect(content).toContain("DTSTART;TZID=Asia/Seoul:20260819T140000");
    expect(content).toContain("DTEND;TZID=Asia/Seoul:20260819T160000");
    expect(content).toContain("SUMMARY:문화 프로그램\\, 안내");
    expect(content).toContain("LOCATION:남양주시 문화의집");
    expect(content).toContain("END:VCALENDAR");
  });

  it("시작 일시가 없으면 잘못된 ICS 파일 대신 명확한 오류를 반환한다", () => {
    expect(() => buildProgramIcs({ ...sampleProgram, startAt: null })).toThrow("일정 시작 일시");
  });
});
