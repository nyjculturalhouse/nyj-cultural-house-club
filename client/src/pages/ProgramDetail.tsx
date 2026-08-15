import { ArrowLeft, CalendarDays, CheckSquare, Download, ExternalLink, MapPin, Users } from "lucide-react";
import { useParams } from "wouter";
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
  return date.toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" });
}

export default function ProgramDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading, isError } = trpc.programs.getById.useQuery({ id }, { enabled: Boolean(id) });
  const icsQuery = trpc.programs.ics.useQuery({ id }, { enabled: false });
  const item = data?.item;

  async function downloadIcs() {
    const result = await icsQuery.refetch();
    if (!result.data) return;
    const blob = new Blob([result.data.content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.data.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="reference-shell min-h-screen bg-white text-black">
      <a className="skip-link" href="#main-content">본문 바로가기</a>
      <header className="reference-header">
        <div className="reference-width reference-header__inner">
          <a className="reference-brand" href="/" aria-label="남양주시 문화의집 웹시스템 홈"><span className="reference-brand__mark" aria-hidden="true"><b>N</b></span><span><strong>남양주시 문화의집</strong><small>웹시스템</small></span></a>
          <nav aria-label="빠른 이동" className="reference-nav"><a href="/programs">프로그램</a><a className="reference-nav__admin" href="/admin.html">관리자</a></nav>
        </div>
      </header>
      <main id="main-content" className="program-page reference-width">
        <a href="/programs" className="monthly-page__back"><ArrowLeft size={16} strokeWidth={1.8} /> 프로그램 목록</a>
        {isLoading && <p className="program-state">프로그램 정보를 불러오는 중입니다.</p>}
        {isError && <p className="program-state program-state--error">프로그램 정보를 불러오지 못했습니다. 목록으로 돌아가 다시 확인해 주세요.</p>}
        {!isLoading && !isError && !item && <p className="program-state program-state--empty">요청한 프로그램을 찾을 수 없습니다.</p>}
        {item && (
          <article className="program-detail">
            <div className="program-detail__head">
              <div><p className="reference-label"><span />{item.category || "문화 프로그램"}</p><h1>{item.title}</h1><p>{item.summary}</p></div>
              <b className={`program-status program-status--${item.recruitmentStatus}`}>{statusLabel[item.recruitmentStatus]}</b>
            </div>
            {item.imageUrl && <img className="program-detail__image" src={item.imageUrl} alt={`${item.title} 안내 이미지`} />}
            <div className="program-detail__layout">
              <section className="program-detail__description"><h2>프로그램 소개</h2><p>{item.description || item.summary}</p></section>
              <aside className="program-detail__side" aria-label="프로그램 기본 정보">
                <dl>
                  <div><dt><CalendarDays size={17} strokeWidth={1.8} />일정</dt><dd>{formatDateTime(item.startAt)}{item.endAt && <><br />~ {formatDateTime(item.endAt)}</>}</dd></div>
                  {item.venue && <div><dt><MapPin size={17} strokeWidth={1.8} />장소</dt><dd>{item.venue}</dd></div>}
                  {item.target && <div><dt><Users size={17} strokeWidth={1.8} />대상</dt><dd>{item.target}</dd></div>}
                  {item.recruitmentDeadline && <div><dt>모집 마감</dt><dd>{formatDateTime(item.recruitmentDeadline)}</dd></div>}
                  {item.contact && <div><dt>문의</dt><dd>{item.contact}</dd></div>}
                </dl>
                {item.startAt && <button className="program-detail__ics" type="button" onClick={downloadIcs} disabled={icsQuery.isFetching}><Download size={17} strokeWidth={1.8} />{icsQuery.isFetching ? "일정 파일 준비 중" : "내 일정에 저장"}</button>}
              </aside>
            </div>
            {item.preApplicationChecks.length > 0 && <section className="program-checks"><h2><CheckSquare size={20} strokeWidth={1.8} /> 신청 전 확인</h2><ul>{item.preApplicationChecks.map((check, index) => <li key={`${check}-${index}`}>{check}</li>)}</ul></section>}
            <section className="program-apply">
              <div><p className="reference-label"><span />공식 신청</p><h2>{item.recruitmentStatus === "closed" ? "모집이 마감되었습니다" : "공식 신청처에서 접수하세요"}</h2><p>{item.recruitmentStatus === "closed" ? "추가 문의가 필요한 경우 프로그램 문의처를 확인해 주세요." : "신청은 남양주문화재단 또는 프로그램별 공식 접수 페이지에서 진행됩니다."}</p></div>
              {item.applicationUrl && item.recruitmentStatus !== "closed" ? <a className="reference-button" href={item.applicationUrl} target="_blank" rel="noopener noreferrer">공식 신청 바로가기 <ExternalLink size={17} strokeWidth={1.8} /></a> : <p className="program-apply__pending">공식 신청 링크 준비 중</p>}
            </section>
          </article>
        )}
      </main>
      <footer className="reference-footer" />
    </div>
  );
}
