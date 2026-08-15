/**
 * Design philosophy: reference-matched monochrome cultural-house editorial layout.
 * The monthly attendance panel reads the supplied Google Apps Script status endpoint; no mock attendance data is used.
 */
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Megaphone,
  Share2,
} from "lucide-react";

const MarkArtwork = "/manus-storage/nyj-mark_454f3ed0.png";

export default function Home() {
  return (
    <div className="reference-shell min-h-screen bg-white text-black">
      <a className="skip-link" href="#main-content">본문 바로가기</a>

      <header className="reference-header">
        <div className="reference-width reference-header__inner">
          <a className="reference-brand" href="/" aria-label="남양주시 문화의집 웹시스템 홈">
            <span className="reference-brand__mark" aria-hidden="true"><img src={MarkArtwork} alt="" /><b>N</b></span>
            <span><strong>남양주시 문화의집</strong><small>웹시스템</small></span>
          </a>
          <nav aria-label="빠른 이동" className="reference-nav">
            <a className="reference-nav__admin" href="/admin.html"><ArrowUpRight size={15} strokeWidth={1.8} /> 관리자</a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="reference-services reference-width" aria-labelledby="service-title">
          <div className="reference-services__heading"><div><p className="reference-label"><span />서비스</p><h2 id="service-title">동아리 활동을 위한 모든 시작점</h2></div></div>
          <nav className="reference-service-grid" aria-label="주요 기능">
            <a className="reference-service" href="/attendance.html"><span>01</span><i><CheckCircle2 size={22} strokeWidth={1.7} /></i><div><h3>동아리 출석부</h3><p>빠르고 정확한 출석 관리</p></div></a>
            <a className="reference-service" href="https://www.nyjcf.or.kr/www/114" target="_blank" rel="noopener noreferrer"><span>02</span><i><CalendarDays size={22} strokeWidth={1.7} /></i><div><h3>공간 이용 예약</h3><p>남양주문화재단에서 공간 이용을 예약하세요.</p><b>예약하기 <ExternalLink size={16} strokeWidth={1.8} /></b></div></a>
            <a className="reference-service" href="/external.html"><span>03</span><i><Share2 size={22} strokeWidth={1.7} /></i><div><h3>외부활동 공유</h3><p>다양한 활동 소식을 간편하게 등록하세요.</p><b>등록하기 <ArrowRight size={16} strokeWidth={1.8} /></b></div></a>
            <a className="reference-service" href="/programs"><span>04</span><i><Megaphone size={22} strokeWidth={1.7} /></i><div><h3>프로그램 안내</h3><p>이번에 열리는 문화 프로그램과 공식 신청처를 확인하세요.</p><b>프로그램 보기 <ArrowRight size={16} strokeWidth={1.8} /></b></div></a>
          </nav>
        </section>

        <section className="reference-width reference-utilities">
          <a href="https://www.nyjcf.or.kr/www/1" target="_blank" rel="noopener noreferrer"><i><ExternalLink size={22} strokeWidth={1.7} /></i><span>남양주문화재단</span><ArrowUpRight className="ml-auto" size={18} strokeWidth={1.8} /></a>
          <a className="reference-utilities__calendar" href="/calendar.html"><i><CalendarDays size={22} strokeWidth={1.7} /></i><span>동아리 활동 일정 확인</span><ArrowRight className="ml-auto" size={18} strokeWidth={1.8} /></a>
          <a className="reference-utilities__booking" href="/booking.html?tab=calendar"><i><CalendarDays size={22} strokeWidth={1.7} /></i><span>대관 확인</span><ArrowRight className="ml-auto" size={18} strokeWidth={1.8} /></a>
        </section>
      </main>
      <footer className="reference-footer" />
    </div>
  );
}
