import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Filter, MapPin, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";

const statusLabel = {
  upcoming: "예정",
  open: "모집 중",
  "closing-soon": "마감 임박",
  closed: "모집 마감",
} as const;

function formatDateTime(value: string | null) {
  if (!value) return "일정 추후 안내";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(cursor: Date) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export default function Programs() {
  const [filters, setFilters] = useState<{ category?: string; target?: string; status?: "upcoming" | "open" | "closing-soon" | "closed" }>({});
  const [view, setView] = useState<"list" | "calendar">("list");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const { data, isLoading, isError } = trpc.programs.list.useQuery(filters);
  const categories = useMemo(() => Array.from(new Set(data?.items.map((item) => item.category).filter(Boolean) ?? [])), [data]);
  const targets = useMemo(() => Array.from(new Set(data?.items.map((item) => item.target).filter(Boolean) ?? [])), [data]);
  const calendarDays = useMemo(() => getMonthDays(monthCursor), [monthCursor]);
  const programsByDate = useMemo(() => {
    const map = new Map<string, NonNullable<typeof data>["items"]>();
    data?.items.forEach((item) => {
      if (!item.startAt) return;
      const date = new Date(item.startAt);
      if (Number.isNaN(date.getTime())) return;
      const key = toDateKey(date);
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [data]);
  const monthName = monthCursor.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  return (
    <div className="reference-shell min-h-screen bg-white text-black">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <header className="reference-header">
        <div className="reference-width reference-header__inner">
          <a className="reference-brand" href="/" aria-label="남양주시 문화의집 웹시스템 홈">
            <span className="reference-brand__mark" aria-hidden="true"><b>N</b></span>
            <span><strong>남양주시 문화의집</strong><small>웹시스템</small></span>
          </a>
          <nav aria-label="빠른 이동" className="reference-nav">
            <a href="/calendar.html">활동 일정</a>
            <a href="https://www.nyjcf.or.kr/www/1" target="_blank" rel="noopener noreferrer">문화재단 <ExternalLink size={13} strokeWidth={1.75} /></a>
            <a className="reference-nav__admin" href="/program-admin">관리자</a>
          </nav>
        </div>
      </header>

      <main id="main-content" className="program-page reference-width">
        <a href="/" className="monthly-page__back">← 홈으로 돌아가기</a>
        <p className="reference-label"><span />프로그램</p>

        <section className="program-filter" aria-labelledby="program-filter-title">
          <div className="program-filter__heading"><Filter size={18} strokeWidth={1.8} /><strong id="program-filter-title">프로그램 찾아보기</strong></div>
          <div className="program-filter__controls">
            <label>주제
              <select value={filters.category ?? ""} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value || undefined }))}>
                <option value="">전체</option>
                {categories.map((category) => <option value={category} key={category}>{category}</option>)}
              </select>
            </label>
            <label>대상
              <select value={filters.target ?? ""} onChange={(event) => setFilters((current) => ({ ...current, target: event.target.value || undefined }))}>
                <option value="">전체</option>
                {targets.map((target) => <option value={target} key={target}>{target}</option>)}
              </select>
            </label>
            <label>모집 상태
              <select value={filters.status ?? ""} onChange={(event) => setFilters((current) => ({ ...current, status: (event.target.value || undefined) as typeof filters.status }))}>
                <option value="">전체</option>
                {Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </section>

        <div className="program-viewbar" aria-label="프로그램 보기 방식">
          <div role="group" className="program-viewbar__tabs" aria-label="보기 방식 선택">
            <button type="button" onClick={() => setView("list")} className={view === "list" ? "is-active" : ""} aria-pressed={view === "list"}>목록</button>
            <button type="button" onClick={() => setView("calendar")} className={view === "calendar" ? "is-active" : ""} aria-pressed={view === "calendar"}>달력</button>
          </div>
          {view === "calendar" && <div className="program-viewbar__month"><button type="button" onClick={() => setMonthCursor((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="이전 달"><ChevronLeft size={19} strokeWidth={1.8} /></button><strong>{monthName}</strong><button type="button" onClick={() => setMonthCursor((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="다음 달"><ChevronRight size={19} strokeWidth={1.8} /></button></div>}
        </div>

        {isLoading && <p className="program-state">공개 프로그램을 불러오는 중입니다.</p>}
        {isError && <p className="program-state program-state--error">프로그램 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</p>}
        {!isLoading && !isError && data?.items.length === 0 && (
          <div className="program-state program-state--empty">
            <strong>현재 공개된 프로그램이 없습니다.</strong>
            <p>담당자가 공식 프로그램 정보와 신청 링크를 등록하면 이곳에 표시됩니다.</p>
          </div>
        )}
        {!isLoading && view === "list" && data && data.items.length > 0 && (
          <section className="program-grid" aria-label="공개 프로그램 목록">
            {data.items.map((item) => (
              <article className="program-card" key={item.id}>
                <div className="program-card__visual">
                  {item.imageUrl ? <img src={item.imageUrl} alt={`${item.title} 안내 이미지`} /> : <span aria-hidden="true">PROGRAM<br />{item.category || "CULTURE"}</span>}
                </div>
                <div className="program-card__body">
                  <div className="program-card__meta"><span>{item.category || "문화 프로그램"}</span><b className={`program-status program-status--${item.recruitmentStatus}`}>{statusLabel[item.recruitmentStatus]}</b></div>
                  <h2>{item.title}</h2>
                  <p>{item.summary}</p>
                  <dl>
                    <div><dt><CalendarDays size={15} strokeWidth={1.8} />일정</dt><dd>{formatDateTime(item.startAt)}</dd></div>
                    {item.venue && <div><dt><MapPin size={15} strokeWidth={1.8} />장소</dt><dd>{item.venue}</dd></div>}
                    {item.target && <div><dt><Users size={15} strokeWidth={1.8} />대상</dt><dd>{item.target}</dd></div>}
                  </dl>
                  <a className="program-card__link" href={`/programs/${encodeURIComponent(item.id)}`}>자세히 보기 <ArrowRight size={17} strokeWidth={1.8} /></a>
                </div>
              </article>
            ))}
          </section>
        )}
        {!isLoading && !isError && view === "calendar" && data && (
          <section className="program-calendar" aria-label={`${monthName} 프로그램 달력`}>
            <div className="program-calendar__weekdays" aria-hidden="true"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
            <div className="program-calendar__grid">
              {calendarDays.map((date) => {
                const key = toDateKey(date);
                const dayPrograms = programsByDate.get(key) ?? [];
                const outside = date.getMonth() !== monthCursor.getMonth();
                const today = key === toDateKey(new Date());
                return <div className={`program-calendar__day${outside ? " is-outside" : ""}${today ? " is-today" : ""}`} key={key}><span>{date.getDate()}</span><div>{dayPrograms.map((item) => <a href={`/programs/${encodeURIComponent(item.id)}`} key={item.id} className={`program-calendar__event program-calendar__event--${item.recruitmentStatus}`}>{item.title}</a>)}</div></div>;
              })}
            </div>
            {data.items.filter((item) => item.startAt && new Date(item.startAt).getFullYear() === monthCursor.getFullYear() && new Date(item.startAt).getMonth() === monthCursor.getMonth()).length === 0 && <p className="program-calendar__empty">선택한 달에 시작하는 공개 프로그램이 없습니다.</p>}
          </section>
        )}
      </main>
      <footer className="reference-footer" />
    </div>
  );
}
