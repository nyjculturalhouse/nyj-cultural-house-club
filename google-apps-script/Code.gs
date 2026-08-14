/**
 * 남양주시 문화의집 동아리 시스템 Google Apps Script 웹앱
 *
 * 스프레드시트에 연결된 Apps Script 프로젝트의 Code.gs 전체를 이 파일로 교체합니다.
 * 프로젝트 설정의 시간대는 Asia/Seoul로 지정합니다.
 */

const APP = Object.freeze({
  version: "2026-08-14",
  timeZone: "Asia/Seoul",
  sheets: {
    clubs: "동아리정보",
    attendance: "출석부",
    bookings: "대관신청",
    activities: "외부활동",
  },
  clubColumns: {
    day: ["요일", "활동요일", "day"],
    club: ["동아리명", "동아리", "club"],
    members: ["회원", "회원명", "구성원", "members"],
  },
  attendanceHeaders: ["출석일", "동아리명", "출석인원", "출석자", "요일", "출석주차", "요청ID"],
  bookingHeaders: ["신청일", "신청자", "연락처", "공간", "사용일시", "사용시간", "예상인원", "대관사유", "이용동의", "개인정보동의", "요청ID"],
  activityHeaders: ["등록일", "동아리", "연락처", "행사명", "상세내용", "행사시작일시", "행사종료일시", "종일여부", "요청ID"],
});

function doGet(e) {
  try {
    const parameter = (e && e.parameter) || {};
    const mode = normaliseText(parameter.mode);

    switch (mode) {
      case "getClubs":
        return json(getClubs(parameter.day));
      case "getMembers":
        return json(getMembers(parameter.club));
      case "getAttendanceStatus":
        return json(getAttendanceStatus());
      case "getMonthlyAttendanceStatus":
        return json(getMonthlyAttendanceStatus(parameter.year, parameter.month));
      case "getBookings":
        return json(getBookings());
      case "getActivities":
        return json(getActivities());
      case "health":
        return json({ ok: true, version: APP.version, timeZone: APP.timeZone, now: formatDateKey(new Date()) });
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
    if (normaliseText(payload.honeypot)) return json({ ok: true });

    switch (normaliseText(payload.mode)) {
      case "submitAttendance":
        return json(submitAttendance(payload));
      case "submitBooking":
        return json(submitBooking(payload));
      case "submitExternal":
        return json(submitExternal(payload));
      default:
        return json({ error: "지원하지 않는 요청입니다." });
    }
  } catch (error) {
    console.error(error);
    return json({ error: safeErrorMessage(error) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function parseRequestBody(e) {
  const contents = e && e.postData && e.postData.contents;
  if (!contents) return (e && e.parameter) || {};
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

function normaliseText(value) {
  return String(value == null ? "" : value).trim();
}

function normaliseDay(value) {
  return normaliseText(value).replace("요일", "").slice(0, 1);
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort(function (left, right) {
    return left.localeCompare(right, "ko");
  });
}

function getSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("연결된 스프레드시트를 찾을 수 없습니다.");
  return spreadsheet;
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function getSheetValues(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return [];
  return sheet.getDataRange().getValues();
}

function findColumn(headers, aliases, fallbackIndex) {
  const normalisedHeaders = headers.map(function (header) {
    return normaliseText(header).toLowerCase();
  });
  for (let index = 0; index < aliases.length; index += 1) {
    const found = normalisedHeaders.indexOf(aliases[index].toLowerCase());
    if (found >= 0) return found;
  }
  return fallbackIndex;
}

function ensureRecordSheet(name, headers) {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(normaliseText);
  const missing = headers.filter(function (header) {
    return existing.indexOf(header) === -1;
  });
  if (missing.length) sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureAttendanceSheet() {
  return ensureRecordSheet(APP.sheets.attendance, APP.attendanceHeaders);
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
      if (member.trim()) members.push(member.trim());
    });
  });
  return uniqueSorted(members);
}

function toLocalCalendarDate(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const text = normaliseText(value);
  if (!text) return null;
  const parsed = new Date(text.replace(/-/g, "/"));
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function dateFromIso(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normaliseText(isoDate))) return null;
  const parts = isoDate.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] ? date : null;
}

function parseLocalDateTime(value) {
  const text = normaliseText(value);
  if (!text) return null;
  const parsed = new Date(text.replace(" ", "T").replace(/-/g, "/"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateKey(date) {
  return Utilities.formatDate(date, APP.timeZone, "yyyy-MM-dd");
}

function formatDateTimeValue(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, APP.timeZone, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return normaliseText(value);
}

function getMonthWeekIndex(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.min(5, Math.ceil((date.getDate() + firstDay) / 7));
}

function getMonthWeekKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, getMonthWeekIndex(date)].join("-");
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
  return Object.keys(ranges).map(Number).sort(function (left, right) {
    return left - right;
  }).map(function (index) {
    return { index: index, start: formatDateKey(ranges[index].start), end: formatDateKey(ranges[index].end) };
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
    if (date && club) lookup[club + "|" + getMonthWeekKey(date)] = true;
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
        return { index: week.index, start: week.start, end: week.end, completed: wasCompleted(completed, club, year, month, week.index) };
      }),
    };
  });
}

function getAttendanceStatus() {
  const now = new Date();
  const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const completed = createAttendanceLookup(getAttendanceRows());
  return getAllClubNames().map(function (club) {
    return {
      club: club,
      lastWeek: wasCompleted(completed, club, lastWeek.getFullYear(), lastWeek.getMonth() + 1, getMonthWeekIndex(lastWeek)),
      thisWeek: wasCompleted(completed, club, now.getFullYear(), now.getMonth() + 1, getMonthWeekIndex(now)),
    };
  });
}

function submitAttendance(payload) {
  const club = normaliseText(payload.clubName || payload.club);
  const requestedCount = Number(payload.attendanceCount);
  const attendees = Array.isArray(payload.attendees) ? uniqueSorted(payload.attendees.map(normaliseText)) : [];
  const attendanceCount = Number.isInteger(requestedCount) && requestedCount > 0 ? requestedCount : attendees.length;
  const day = normaliseDay(payload.day);
  const requestId = normaliseText(payload.uid);
  if (!club) throw new Error("동아리를 선택해 주세요.");
  if (!attendanceCount) throw new Error("출석 인원을 한 명 이상 입력해 주세요.");

  const recordDate = dateFromIso(payload.attendanceWeek) || toLocalCalendarDate(new Date());
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ensureAttendanceSheet();
    const weekKey = getMonthWeekKey(recordDate);
    const duplicate = getAttendanceRows().some(function (row) {
      const existingDate = toLocalCalendarDate(row[0]);
      return existingDate && normaliseText(row[1]) === club && getMonthWeekKey(existingDate) === weekKey;
    });
    if (duplicate) return { error: "이미 해당 주차의 출석부를 제출하였습니다.", alreadySubmitted: true };

    sheet.appendRow([recordDate, club, attendanceCount, attendees.length ? attendees.join(", ") : "인원 수 입력", day, formatDateKey(recordDate), requestId]);
    return { ok: true, msg: "출석 완료", attendanceWeek: weekKey };
  } finally {
    lock.releaseLock();
  }
}

function getBookings() {
  const sheet = getSheet(APP.sheets.bookings);
  const values = getSheetValues(sheet);
  if (values.length < 2) return [];
  const headers = values[0];
  const nameIndex = findColumn(headers, ["신청자", "신청자이름", "name"], 1);
  const spaceIndex = findColumn(headers, ["공간", "공간명", "space"], 3);
  const startIndex = findColumn(headers, ["사용일시", "대관일시", "dateTime", "시작일시"], 4);
  const hoursIndex = findColumn(headers, ["사용시간", "시간", "hours"], 5);

  return values.slice(1).map(function (row) {
    const start = formatDateTimeValue(row[startIndex]);
    const hours = Number(row[hoursIndex]) || 0;
    const startDate = parseLocalDateTime(start);
    const end = startDate && hours > 0 ? formatDateTimeValue(new Date(startDate.getTime() + hours * 60 * 60 * 1000)) : "";
    const name = normaliseText(row[nameIndex]);
    const space = normaliseText(row[spaceIndex]);
    return { title: [space, name].filter(Boolean).join(" · ") || "대관 일정", start: start, end: end, space: space };
  }).filter(function (record) {
    return record.start;
  });
}

function getActivities() {
  const sheet = getSheet(APP.sheets.activities);
  const values = getSheetValues(sheet);
  if (values.length < 2) return [];
  const headers = values[0];
  const clubIndex = findColumn(headers, ["동아리", "동아리명", "club"], 1);
  const phoneIndex = findColumn(headers, ["연락처", "phone"], 2);
  const eventIndex = findColumn(headers, ["행사명", "활동명", "event", "title"], 3);
  const contentIndex = findColumn(headers, ["상세내용", "내용", "content"], 4);
  const startIndex = findColumn(headers, ["행사시작일시", "행사일시", "dateTime", "시작일시"], 5);
  const endIndex = findColumn(headers, ["행사종료일시", "종료일시", "endDateTime"], 6);
  const allDayIndex = findColumn(headers, ["종일여부", "종일", "allDay"], 7);

  return values.slice(1).map(function (row) {
    return {
      club: normaliseText(row[clubIndex]),
      phone: normaliseText(row[phoneIndex]),
      event: normaliseText(row[eventIndex]),
      content: normaliseText(row[contentIndex]),
      dateTime: formatDateTimeValue(row[startIndex]),
      endDateTime: formatDateTimeValue(row[endIndex]),
      allDay: normaliseText(row[allDayIndex]).toLowerCase() === "true" || normaliseText(row[allDayIndex]) === "예",
    };
  }).filter(function (record) {
    return record.dateTime;
  });
}

function hasRequestId(sheet, requestId) {
  if (!requestId || sheet.getLastRow() < 2) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const requestIndex = findColumn(headers, ["요청ID", "uid", "requestId"], -1);
  if (requestIndex < 0) return false;
  return sheet.getRange(2, requestIndex + 1, sheet.getLastRow() - 1, 1).getValues().some(function (row) {
    return normaliseText(row[0]) === requestId;
  });
}

function validPhone(phone) {
  return /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(normaliseText(phone));
}

function submitBooking(payload) {
  const name = normaliseText(payload.name);
  const phone = normaliseText(payload.phone);
  const space = normaliseText(payload.space);
  const dateTime = normaliseText(payload.dateTime);
  const hours = Number(payload.hours);
  const count = Number(payload.count);
  const requestId = normaliseText(payload.uid);
  const start = parseLocalDateTime(dateTime);

  if (!name || !phone || !space || !dateTime || !Number.isFinite(hours) || hours < 1 || !Number.isFinite(count) || count < 1) {
    throw new Error("대관 신청의 필수 입력 항목을 확인해 주세요.");
  }
  if (!validPhone(phone)) throw new Error("연락처 형식을 확인해 주세요.");
  if (!start) throw new Error("대관 사용 일시를 확인해 주세요.");

  const minimumDate = new Date();
  minimumDate.setDate(minimumDate.getDate() + 3);
  if (start.getTime() < minimumDate.getTime()) throw new Error("대관 신청은 최소 3일 이후부터 가능합니다.");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ensureRecordSheet(APP.sheets.bookings, APP.bookingHeaders);
    if (hasRequestId(sheet, requestId)) return { ok: true, alreadySubmitted: true, msg: "이미 접수된 대관 신청입니다." };
    sheet.appendRow([new Date(), name, phone, space, dateTime, hours, count, normaliseText(payload.content), normaliseText(payload.agree1), normaliseText(payload.agree2), requestId]);
    return { ok: true, msg: "대관 신청이 접수되었습니다." };
  } finally {
    lock.releaseLock();
  }
}

function submitExternal(payload) {
  const club = normaliseText(payload.club);
  const phone = normaliseText(payload.phone);
  const event = normaliseText(payload.eventName || payload.event || payload.title);
  const content = normaliseText(payload.content);
  const dateTime = normaliseText(payload.dateTime);
  const endDateTime = normaliseText(payload.endDateTime);
  const allDay = payload.allDay === true || normaliseText(payload.allDay).toLowerCase() === "true";
  const requestId = normaliseText(payload.uid);

  if (!club || !phone || !event || !content || !dateTime) {
    throw new Error("외부활동의 필수 입력 항목을 확인해 주세요.");
  }
  if (!validPhone(phone)) throw new Error("연락처 형식을 확인해 주세요.");
  if (!parseLocalDateTime(dateTime)) throw new Error("행사 일시를 확인해 주세요.");
  if (endDateTime && !parseLocalDateTime(endDateTime)) throw new Error("행사 종료 일시를 확인해 주세요.");

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ensureRecordSheet(APP.sheets.activities, APP.activityHeaders);
    if (hasRequestId(sheet, requestId)) return { ok: true, alreadySubmitted: true, msg: "이미 등록된 외부활동입니다." };
    sheet.appendRow([new Date(), club, phone, event, content, dateTime, endDateTime, allDay ? "true" : "false", requestId]);
    return { ok: true, msg: "외부활동이 등록되었습니다." };
  } finally {
    lock.releaseLock();
  }
}

/** 최초 설치 또는 새 코드 배포 후 한 번 실행하면 필요한 시트·헤더를 준비합니다. */
function initializeSheets() {
  ensureAttendanceSheet();
  ensureRecordSheet(APP.sheets.bookings, APP.bookingHeaders);
  ensureRecordSheet(APP.sheets.activities, APP.activityHeaders);
  return { ok: true, msg: "출석부·대관신청·외부활동 시트를 확인했습니다." };
}
