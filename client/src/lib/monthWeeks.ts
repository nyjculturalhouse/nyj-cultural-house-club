export type MonthWeek = {
  index: number;
  label: string;
  weekStart: string;
  weekEnd: string;
};

function toLocalDateString(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatWeekStart(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(date);
}

/**
 * 해당 월의 날짜를 1~5주차로 변환합니다. 달력상 6번째 구간이 발생하면 5주차에 합칩니다.
 */
export function getMonthWeekIndex(date: Date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.min(5, Math.ceil((date.getDate() + firstDay) / 7));
}

/**
 * 해당 월에 실제 존재하는 주차만 반환합니다. 4주만 있는 달은 4개 항목만 반환합니다.
 */
export function getMonthWeeks(date: Date): MonthWeek[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const ranges = new Map<number, { start: Date; end: Date }>();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(year, month, day);
    const index = getMonthWeekIndex(current);
    const range = ranges.get(index);
    if (range) range.end = current;
    else ranges.set(index, { start: current, end: current });
  }

  return Array.from(ranges.entries()).map(([index, range]) => ({
    index,
    label: `${index}주차 · ${formatWeekStart(range.start)}–${range.end.getDate()}일`,
    weekStart: toLocalDateString(range.start),
    weekEnd: toLocalDateString(range.end),
  }));
}

/** 아직 시작하지 않은 주차는 제외하고, 오늘 시작했거나 이미 지난 주차만 반환합니다. */
export function getStartedMonthWeeks(weeks: MonthWeek[], currentDate: Date): MonthWeek[] {
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
  return weeks.filter((week) => new Date(`${week.weekStart}T00:00:00`).getTime() <= today);
}
