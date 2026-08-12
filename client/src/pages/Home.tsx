/**
 * Design philosophy: reference-matched monochrome cultural-house editorial layout.
 * The monthly attendance panel reads the supplied Google Apps Script status endpoint; no mock attendance data is used.
 */
import { useMemo, useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ExternalLink,
  Share2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const HeroArtwork = "/manus-storage/nyj-hero-grid_89a9d994.png";
const MarkArtwork = "/manus-storage/nyj-mark_454f3ed0.png";

type WeekStatus = { key: "previous" | "current"; label: string; pendingCount: number; weekStart: string };

function formatWeekStart(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(date);
}

function startOfAttendanceWeek(date: Date) {
  const copy = new Date(date);
  const daysSinceSaturday = (copy.getDay() + 1) % 7;
  copy.setDate(copy.getDate() - daysSinceSaturday);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toLocalDateString(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function Home() {
  const monthlyPanelRef = useRef<HTMLElement>(null);
  const monthlyQuery = trpc.attendance.status.useQuery(undefined, {
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const weeks = useMemo<WeekStatus[]>(() => {
    if (!monthlyQuery.data) return [];
    const current = startOfAttendanceWeek(new Date());
    const previous = new Date(current);
    previous.setDate(previous.getDate() - 7);
    return [
      { key: "previous", label: `${formatWeekStart(previous)} 시작 주차`, pendingCount: monthlyQuery.data.filter((item) => !item.lastWeek).length, weekStart: toLocalDateString(previous) },
      { key: "current", label: `${formatWeekStart(current)} 시작 주차`, pendingCount: monthlyQuery.data.filter((item) => !item.thisWeek).length, weekStart: toLocalDateString(current) },
    ];
  }, [monthlyQuery.data]);

  const loadMonthlyAttendance = async () => {
    monthlyPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (monthlyQuery.isFetching) return;
    await monthlyQuery.refetch();
  };

  const openAttendance = (weekStart: string) => {
    window.location.href = `/attendance.html?week=${encodeURIComponent(weekStart)}`;
  };

  return (
    <div className="reference-shell min-h-screen bg-white text-black">
      <a className="skip-link" href="#main-content">본문 바로가기</a>

      <header className="reference-header">
        <div className="reference-width reference-header__inner">
          <a className="reference-brand" href="/" aria-label="남양주시 문화의집 웹시스템 홈">
            <span className="reference-brand__mark" aria-hidden="true"><img src={MarkArtwork} alt="" /><b>N</b></span>
            <span><strong>남양주시 문화의집</strong><small>CULTURAL HOUSE</small></span>
          </a>
          <nav aria-label="빠른 이동" className="reference-nav">
            <a href="/calendar.html">활동 일정</a>
            <a href="https://www.nyjcf.or.kr/www/1" target="_blank" rel="noopener noreferrer">문화재단 <ExternalLink size={13} strokeWidth={1.75} /></a>
            <a className="reference-nav__admin" href="/admin.html"><ArrowUpRight size={15} strokeWidth={1.8} /> 관리자</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="reference-width reference-hero">
          <div className="reference-hero__copy">
            <p className="reference-label"><span />NAMYANGJU CULTURAL HOUSE</p>
            <h1>함께 만드는<br />문화의 일상</h1>
            <p className="reference-hero__description">동아리의 출석부터 공간 예약, 활동 기록까지. 남양주시 문화의집의 모든 모임을 더 쉽고 즐겁게 연결합니다.</p>
            <div className="reference-hero__actions">
              <a className="reference-button" href="/attendance.html">동아리 출석 시작하기 <ArrowRight size={18} strokeWidth={1.9} /></a>
              <button className="reference-text-button" type="button" onClick={loadMonthlyAttendance}>이번 달 활동 살펴보기 <ArrowUpRight size={16} strokeWidth={1.8} /></button>
            </div>
            <div className="reference-hero__benefits" aria-label="주요 서비스">
              <span><Check size={14} strokeWidth={2} />간편한 출석 관리</span>
              <span><CalendarDays size={14} strokeWidth={1.9} />편리한 공간 예약</span>
              <span><Share2 size={14} strokeWidth={1.9} />활동 소식 공유</span>
            </div>
          </div>

          <div className="reference-art" aria-hidden="true">
            <div className="reference-art__grid" />
            <img className="reference-art__texture" src={HeroArtwork} alt="" />
            <article className="reference-art__black-card">
              <div><span>COMMUNITY</span><span>2026</span></div>
              <i>✳</i>
              <strong>함께 모여<br />더 멀리 갑니다.</strong>
              <em />
            </article>
            <article className="reference-art__schedule"><CalendarDays size={17} strokeWidth={1.8} /><b>활동 일정</b><small>우리 모임의 다음 만남</small></article>
            <article className="reference-art__archive"><Share2 size={18} strokeWidth={1.8} /><b>활동 아카이브</b></article>
            <p>CULTURE<br />CONNECTS<br />US</p>
          </div>
        </section>

        <section ref={monthlyPanelRef} className="reference-monthly" aria-live="polite">
          <div className="reference-width reference-monthly__inner">
            <div><p className="reference-label"><span />MONTHLY ATTENDANCE</p><h2>이번 달 출석 확인</h2></div>
            <div className="reference-monthly__content">
              {!monthlyQuery.isFetching && !monthlyQuery.isFetched && <p>이번 달 활동 살펴보기를 누르면 미출석 주차를 확인합니다.</p>}
              {monthlyQuery.isFetching && <p>출석 현황을 확인하는 중입니다.</p>}
              {monthlyQuery.error && <p>출석 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
              {weeks.length > 0 && <div className="week-status-grid">
                {weeks.map((week) => <article className="week-status" key={week.key}>
                  <p>{week.label}</p>
                  <strong>{week.pendingCount > 0 ? `${week.pendingCount}개 동아리 출석 확인 필요` : "출석 확인 완료"}</strong>
                  <button type="button" onClick={() => openAttendance(week.weekStart)}>{week.pendingCount > 0 ? "출석체크 하기" : "출석부 열기"} <ArrowRight size={16} strokeWidth={1.8} /></button>
                </article>)}
              </div>}
            </div>
          </div>
        </section>

        <section className="reference-services reference-width" aria-labelledby="service-title">
          <div className="reference-services__heading"><div><p className="reference-label"><span />SERVICE</p><h2 id="service-title">동아리 활동을 위한<br />모든 시작점</h2></div><p>필요한 업무는 간결하게, 소중한 활동은 더 풍성하게. 지금 필요한 서비스를 선택해 주세요.</p></div>
          <nav className="reference-service-grid" aria-label="주요 기능">
            <a className="reference-service reference-service--active" href="/attendance.html"><span>01</span><i><CheckCircle2 size={22} strokeWidth={1.7} /></i><div><h3>동아리 출석부</h3><p>빠르고 정확한 출석 관리</p></div></a>
            <a className="reference-service" href="/booking.html"><span>02</span><i><CalendarDays size={22} strokeWidth={1.7} /></i><div><h3>공간 이용 예약</h3><p>원하는 시간에 필요한 공간을 예약하세요.</p><b>예약하기 <ArrowRight size={16} strokeWidth={1.8} /></b></div></a>
            <a className="reference-service" href="/external.html"><span>03</span><i><Share2 size={22} strokeWidth={1.7} /></i><div><h3>외부활동 공유</h3><p>다양한 활동 소식을 간편하게 등록하세요.</p><b>등록하기 <ArrowRight size={16} strokeWidth={1.8} /></b></div></a>
          </nav>
        </section>

        <section className="reference-width reference-utilities">
          <a href="https://www.nyjcf.or.kr/www/1" target="_blank" rel="noopener noreferrer"><i><ExternalLink size={22} strokeWidth={1.7} /></i><span>남양주문화재단</span><ArrowUpRight className="ml-auto" size={18} strokeWidth={1.8} /></a>
          <a className="reference-utilities__calendar" href="/calendar.html"><i><CalendarDays size={22} strokeWidth={1.7} /></i><span>동아리 활동 일정 확인</span><ArrowRight className="ml-auto" size={18} strokeWidth={1.8} /></a>
        </section>
      </main>
      <footer className="reference-footer" />
    </div>
  );
}
