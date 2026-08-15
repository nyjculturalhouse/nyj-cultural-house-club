import * as XLSX from "xlsx";

export type AttendanceExportStatus = {
  club: string;
  lastWeek: boolean;
  thisWeek: boolean;
};

export type AttendanceExportMonth = {
  club: string;
  weeks: Array<{ index: number; start: string; end: string; completed: boolean }>;
};

const statusLabel = (completed: boolean) => completed ? "완료" : "미완료";
const dateLabel = (value: string) => value ? value.replaceAll("-", ".") : "-";

export function buildAttendanceWorkbook(statuses: AttendanceExportStatus[], months: AttendanceExportMonth[], generatedAt = new Date()) {
  const workbook = XLSX.utils.book_new();
  const overviewRows: (string | number)[][] = [
    ["남양주시 문화의집 동아리 출석 현황"],
    ["생성 일시", generatedAt.toLocaleString("ko-KR")],
    [],
    ["동아리", "지난주 출석", "이번 주 출석", "이번 주 상태"],
    ...statuses.map(item => [item.club, statusLabel(item.lastWeek), statusLabel(item.thisWeek), item.thisWeek ? "출석 등록 완료" : "출석 등록 필요"]),
  ];
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  overviewSheet["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 22 }];

  const monthRows: (string | number)[][] = [
    ["남양주시 문화의집 월간 출석 기록"],
    ["동아리", "주차", "시작일", "종료일", "출석 상태"],
    ...months.flatMap(item => item.weeks.map(week => [item.club, `${week.index}주차`, dateLabel(week.start), dateLabel(week.end), statusLabel(week.completed)])),
  ];
  const monthSheet = XLSX.utils.aoa_to_sheet(monthRows);
  monthSheet["!cols"] = [{ wch: 24 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];

  XLSX.utils.book_append_sheet(workbook, overviewSheet, "출석 현황");
  XLSX.utils.book_append_sheet(workbook, monthSheet, "월간 출석");
  return workbook;
}

export function downloadAttendanceWorkbook(statuses: AttendanceExportStatus[], months: AttendanceExportMonth[], generatedAt = new Date()) {
  const date = generatedAt.toISOString().slice(0, 10).replaceAll("-", "");
  XLSX.writeFile(buildAttendanceWorkbook(statuses, months, generatedAt), `남양주시문화의집_출석현황_${date}.xlsx`);
}
