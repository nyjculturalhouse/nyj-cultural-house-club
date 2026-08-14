import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { getMonthWeeks, getStartedMonthWeeks, type MonthWeek } from "@/lib/monthWeeks";

type ClubWeekState = "complete" | "pending" | "waiting";
type ClubWeekStatus = MonthWeek & { state: ClubWeekState };
type ClubAttendanceStatus = { club: string; pendingCount: number; waitingCount: number; complete: boolean; weeks: ClubWeekStatus[] };
type MonthlyStatusResponse = { club: string; year: number; month: number; weeks: Array<{ index: number; start: string; end: string; completed: boolean }> };

export default function MonthlyAttendance() {
  const [expandedClub, setExpandedClub] = useState<string | null>(() => new URLSearchParams(window.location.search).get("club"));
  const [currentMonth] = useState(() => new Date());
  const queryInput = useMemo(() => ({ year: currentMonth.getFullYear(), month: currentMonth.getMonth() + 1 }), [currentMonth]);
  const monthlyQuery = trpc.attendance.monthlyStatus.useQuery(queryInput, { retry: false, refetchOnWindowFocus: false });
  const monthWeeks = useMemo(() => getMonthWeeks(currentMonth), [currentMonth]);
  const startedMonthWeeks = useMemo(() => getStartedMonthWeeks(monthWeeks, currentMonth), [monthWeeks, currentMonth]);
  const monthlyStatuses = useMemo<MonthlyStatusResponse[]>(() => {
    const statuses = monthlyQuery.data?.statuses;
    return Array.isArray(statuses) ? statuses as MonthlyStatusResponse[] : [];
  }, [monthlyQuery.data]);
  const clubs = useMemo<ClubAttendanceStatus[]>(() => {
    if (monthlyStatuses.length === 0 || startedMonthWeeks.length === 0) return [];
    return monthlyStatuses.map((item) => {
      const weeks = startedMonthWeeks.map((week): ClubWeekStatus => {
        const reportedWeek = item.weeks.find((reported) => reported.index === week.index);
        if (!reportedWeek) return { ...week, state: "waiting" };
        return { ...week, state: reportedWeek.completed ? "complete" : "pending" };
      });
      const pendingCount = weeks.filter((week) => week.state === "pending").length;
      const waitingCount = weeks.filter((week) => week.state === "waiting").length;
      return { club: item.club, pendingCount, waitingCount, complete: weeks.every((week) => week.state === "complete"), weeks };
    }).filter((club) => !club.complete).sort((first, second) => second.pendingCount - first.pendingCount || first.waitingCount - second.waitingCount || first.club.localeCompare(second.club, "ko"));
  }, [monthlyStatuses, startedMonthWeeks]);

  const openAttendance = (weekStart: string, club: string) => {
    const parameters = new URLSearchParams({ week: weekStart, club });
    window.location.href = `/attendance.html?${parameters.toString()}`;
  };

  return <div className="reference-shell min-h-screen bg-white text-black">
    <a className="skip-link" href="#monthly-content">본문 바로가기</a>
    <header className="reference-header">
      <div className="reference-width reference-header__inner">
        <a className="reference-brand" href="/" aria-label="남양주시 문화의집 웹시스템 홈">
          <span className="reference-brand__mark" aria-hidden="true"><b>N</b></span>
          <span><strong>남양주시 문화의집</strong><small>웹시스템</small></span>
        </a>
        <nav aria-label="빠른 이동" className="reference-nav">
          <a href="/calendar.html">활동 일정</a>
          <a href="https://www.nyjcf.or.kr/www/1" target="_blank" rel="noopener noreferrer">문화재단 <ExternalLink size={13} strokeWidth={1.75} /></a>
        </nav>
      </div>
    </header>

    <main id="monthly-content" className="monthly-page reference-width">
      <a className="monthly-page__back" href="/"><ArrowLeft size={17} strokeWidth={1.9} /> 메인으로</a>
      <div className="monthly-page__heading">
        <p className="reference-label"><span />이번 달 출석</p>
        <h1>동아리별 출석 확인</h1>
        <p>시작된 주차의 출석 상태만 확인할 수 있습니다.</p>
      </div>

      <section className="monthly-page__content" aria-live="polite">
        {monthlyQuery.isFetching && <p>출석 현황을 확인하는 중입니다.</p>}
        {monthlyQuery.error && <p>출석 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        {clubs.length > 0 && <>
          <div className="monthly-attendance-summary"><strong>출석 확인이 필요한 동아리 {clubs.length}개</strong><span>아직 시작하지 않은 주차와 출석을 모두 완료한 동아리는 목록에서 제외합니다.</span></div>
          <div className="monthly-attendance-legend" aria-label="출석 상태 안내"><span className="monthly-attendance-legend__pending">출석 필요</span><span className="monthly-attendance-legend__complete">출석 완료</span><span className="monthly-attendance-legend__waiting">이력 연동 대기</span></div>
          <div className="club-attendance-list" aria-label="동아리별 이번 달 출석 현황">
            {clubs.map((club) => {
              const isExpanded = expandedClub === club.club;
              return <article className={`club-attendance-item ${club.pendingCount > 0 ? "club-attendance-item--pending" : ""}`} key={club.club}>
                <button className="club-attendance-toggle" type="button" aria-expanded={isExpanded} onClick={() => setExpandedClub(isExpanded ? null : club.club)}>
                  <span className="club-attendance-name">{club.club}</span>
                  <span className="club-attendance-state">{club.pendingCount > 0 ? `출석 필요 ${club.pendingCount}주` : `이력 확인 ${club.waitingCount}주`}</span>
                  <ChevronDown className={isExpanded ? "club-attendance-chevron club-attendance-chevron--open" : "club-attendance-chevron"} size={18} strokeWidth={1.7} />
                </button>
                {isExpanded && <div className="club-week-drilldown" aria-label={`${club.club} 주차별 출석 현황`}>
                  {club.weeks.map((week) => <button className={`club-week-button club-week-button--${week.state}`} key={week.weekStart} type="button" disabled={week.state === "waiting"} onClick={() => openAttendance(week.weekStart, club.club)}>
                    <span>{week.label}</span><strong>{week.state === "complete" ? "출석 완료" : week.state === "pending" ? "출석하기" : "이력 연동 대기"}</strong>{week.state === "waiting" ? <span className="club-week-button__mark" aria-hidden="true">—</span> : <ArrowRight size={15} strokeWidth={1.8} />}
                  </button>)}
                </div>}
              </article>;
            })}
          </div>
        </>}
        {monthlyQuery.isFetched && !monthlyQuery.error && clubs.length === 0 && <p className="monthly-attendance-complete">{monthlyStatuses.length === 0 ? "이번 달에 확인할 동아리가 없습니다." : "이번 달 출석을 모두 완료했습니다."}</p>}
      </section>
    </main>
  </div>;
}
