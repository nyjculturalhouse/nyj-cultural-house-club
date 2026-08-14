/**
 * 남양주시 문화의집 동아리 시스템 Google Apps Script 웹앱
 *
 * 스프레드시트에 바인드된 Apps Script 프로젝트의 Code.gs 전체를 이 파일 내용으로 교체합니다.
 * 시간대는 프로젝트 설정에서 Asia/Seoul로 지정해야 합니다.
 */

const APP = Object.freeze({
  timeZone: "Asia/Seoul",
  sheets: {
    clubs: "동아리정보",
    attendance: "출석부",
  },
  clubColumns: {
    day: ["요일", "활동요일", "day"],
    club: ["동아리명", "동아리", "club"],
    members: ["회원", "회원명", "구성원", "members"],
  },
  attendanceHeaders: ["출석일", "동아리명", "출석인원", "출석자", "요일", "출석주차"],
});

function doGet(e) {
  try {
    const parameter = (e && e.parameter) || {};
    const mode = String(parameter.mode || "").trim();

    switch (mode) {
      case "getClubs":
        return json(getClubs(parameter.day));
      case "getMembers":
        return json(getMembers(parameter.club));
      case "getAttendanceStatus":
        return json(getAttendanceStatus());
      case "getMonthlyAttendanceStatus":
        return json(getMonthlyAttendanceStatus(parameter.year, parameter.month));
      case "health":
        return json({ ok: true, timeZone: APP.timeZone, now: formatDateKey(new Date()) });
      default:
        return json({ error: "지원하지 않는 요청입니다." });
    }
  } catch (error) {
    console.error(error);
    return json({ error: safeErrorMessage(error) });
  }
}

function doPost(e) {
  try {
    const payload = parseRequestBody(e);
    if (String(payload.honeypot || "").trim()) return json({ ok: true });

    switch (String(payload.mode || "").trim()) {
      case "submitAttendance":
        return json(submitAttendance(payload));
      default:
        return json({ error: "지원하지 않는 요청입니다." });
    }
  } catch (error) {
    console.error(error);
    return json({ error: safeErrorMessage(error) });
  }
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseRequestBody(e) {
  const contents = e && e.postData && e.postData.contents;
  if (!contents) return {};
  try {
    return JSON.parse(contents);
  } catch (_error) {
    throw new Error("요청 형식이 올바르지 않습니다.");
  }
}

function safeErrorMessage(error) {
  const message = error && error.message ? String(error.message) : "서버 처리 중 오류가 발생했습니다.";
  return message.slice(0, 160);
}

function getSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("연결된 스프레드시트를 찾을 수 없습니다.");
  return spreadsheet;
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function ensureAttendanceSheet() {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(APP.sheets.attendance) || spreadsheet.insertSheet(APP.sheets.attendance);
  if (sheet.getLastRow() === 0) sheet.appendRow(APP.attendanceHeaders);
  return sheet;
}

function getSheetValues(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return [];
  return sheet.getDataRange().getValues();
}

function normaliseText(value) {
  return String(value == null ? "" : value).trim();
}

function normaliseDay(value) {
  return normaliseText(value).replace("요일", "").slice(0, 1);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort(function (first, second) {
    return first.localeCompare(second, "ko");
  });
}

function findColumn(headers, aliases, fallbackIndex) {
  const normalizedHeaders = headers.map(function (header) {
    return normaliseText(header).toLowerCase();
  });
  for (let index = 0; index < aliases.length; index += 1) {
    const found = normalizedHeaders.indexOf(aliases[index].toLowerCase());
    if (found >= 0) return found;
  }
  return fallbackIndex;
}

function getClubDirectory() {
  const sheet = getSheet(APP.sheets.clubs);
  if (!sheet) throw new Error("동아리정보 시트를 찾을 수 없습니다.");

  const values = getSheetValues(sheet);
  if (values.length < 2) return { rows: [], dayIndex: 0, clubIndex: 1, membersIndex: 2 };

  const headers = values[0];
  return {
    rows: values.slice(1),
    dayIndex: findColumn(headers, APP.clubColumns.day, 0),
    clubIndex: findColumn(headers, APP.clubColumns.club, 1),
    membersIndex: findColumn(headers, APP.clubColumns.members, 2),
  };
}

function getAllClubNames() {
  const directory = getClubDirectory();
  return uniqueSorted(directory.rows.map(function (row) {
    return normaliseText(row[directory.clubIndex]);
  }).filter(function (club) {
    return club && club !== "동아리명";
  }));
}

function getClubs(dayValue) {
  const day = normaliseDay(dayValue);
  if (!day) return [];

  const directory = getClubDirectory();
  return uniqueSorted(directory.rows.filter(function (row) {
    return normaliseDay(row[directory.dayIndex]) === day;
  }).map(function (row) {
    return normaliseText(row[directory.clubIndex]);
  }));
}

function getMembers(clubValue) {
  const club = normaliseText(clubValue);
  if (!club) return [];

  const directory = getClubDirectory();
  const members = [];
  directory.rows.forEach(function (row) {
    if (normaliseText(row[directory.clubIndex]) !== club) return;
    normaliseText(row[directory.membersIndex]).split(/[,\n;]/).forEach(function (member) {
      const trimmed = member.trim();
      if (trimmed) members.push(trimmed);
    });
  });
  return uniqueSorted(members);
}

function toLocalCalendarDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const stringValue = normaliseText(value);
  if (!stringValue) return null;
  const parsed = new Date(stringValue.replace(/-/g, "/"));
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function dateFromIso(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normaliseText(isoDate))) return null;
  const parts = isoDate.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] ? date : null;
}

/** 달력상 여섯 번째 구간이 생겨도 사용자 화면의 1~5주차 규칙에 맞춰 5주차로 합칩니다. */
function getMonthWeekIndex(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.min(5, Math.ceil((date.getDate() + firstDay) / 7));
}

function getMonthWeekKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, getMonthWeekIndex(date)].join("-");
}

function formatDateKey(date) {
  return Utilities.formatDate(date, APP.timeZone, "yyyy-MM-dd");
}

function getMonthWeekRanges(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const ranges = {};
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const index = getMonthWeekIndex(date);
    if (!ranges[index]) ranges[index] = { index: index, start: date, end: date };
    ranges[index].end = date;
  }
  return Object.keys(ranges).map(Number).sort(function (first, second) {
    return first - second;
  }).map(function (index) {
    return {
      index: index,
      start: formatDateKey(ranges[index].start),
      end: formatDateKey(ranges[index].end),
    };
  });
}

function getAttendanceRows() {
  const sheet = getSheet(APP.sheets.attendance);
  const values = getSheetValues(sheet);
  return values.length > 1 ? values.slice(1) : [];
}

function createAttendanceLookup(rows) {
  const lookup = {};
  rows.forEach(function (row) {
    const date = toLocalCalendarDate(row[0]);
    const club = normaliseText(row[1]);
    if (!date || !club) return;
    lookup[club + "|" + getMonthWeekKey(date)] = true;
  });
  return lookup;
}

function wasCompleted(lookup, club, year, month, weekIndex) {
  return Boolean(lookup[club + "|" + [year, month, weekIndex].join("-")]);
}

function getMonthlyAttendanceStatus(yearValue, monthValue) {
  const now = new Date();
  const year = Number(yearValue) || now.getFullYear();
  const month = Number(monthValue) || now.getMonth() + 1;
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("연도 또는 월 정보가 올바르지 않습니다.");
  }

  const weeks = getMonthWeekRanges(year, month);
  const completed = createAttendanceLookup(getAttendanceRows());
  return getAllClubNames().map(function (club) {
    return {
      club: club,
      year: year,
      month: month,
      weeks: weeks.map(function (week) {
        return {
          index: week.index,
          start: week.start,
          end: week.end,
          completed: wasCompleted(completed, club, year, month, week.index),
        };
      }),
    };
  });
}

function getAttendanceStatus() {
  const now = new Date();
  const lastWeekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const completed = createAttendanceLookup(getAttendanceRows());

  return getAllClubNames().map(function (club) {
    return {
      club: club,
      lastWeek: wasCompleted(completed, club, lastWeekDate.getFullYear(), lastWeekDate.getMonth() + 1, getMonthWeekIndex(lastWeekDate)),
      thisWeek: wasCompleted(completed, club, now.getFullYear(), now.getMonth() + 1, getMonthWeekIndex(now)),
    };
  });
}

function submitAttendance(payload) {
  const club = normaliseText(payload.clubName);
  const attendees = Array.isArray(payload.attendees) ? uniqueSorted(payload.attendees.map(normaliseText)) : [];
  const requestedCount = Number(payload.attendanceCount);
  const attendanceCount = Number.isInteger(requestedCount) && requestedCount > 0 ? requestedCount : attendees.length;
  const day = normaliseDay(payload.day);
  if (!club) throw new Error("동아리를 선택해 주세요.");
  if (!attendanceCount) throw new Error("출석 인원을 한 명 이상 입력해 주세요.");

  const recordDate = dateFromIso(payload.attendanceWeek) || toLocalCalendarDate(new Date());
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const sheet = ensureAttendanceSheet();
    const targetKey = getMonthWeekKey(recordDate);
    const isDuplicate = getAttendanceRows().some(function (row) {
      const existingDate = toLocalCalendarDate(row[0]);
      return existingDate && normaliseText(row[1]) === club && getMonthWeekKey(existingDate) === targetKey;
    });

    if (isDuplicate) return { error: "이미 해당 주차의 출석부를 제출하였습니다.", alreadySubmitted: true };

    sheet.appendRow([
      recordDate,
      club,
      attendanceCount,
      attendees.length ? attendees.join(", ") : "인원 수 입력",
      day,
      formatDateKey(recordDate),
    ]);
    return { ok: true, msg: "출석 완료", attendanceWeek: targetKey };
  } finally {
    lock.releaseLock();
  }
}

/** 최초 설치 시 한 번 실행하면 출석부 시트와 헤더를 만들 수 있습니다. */
function initializeSheets() {
  ensureAttendanceSheet();
}
