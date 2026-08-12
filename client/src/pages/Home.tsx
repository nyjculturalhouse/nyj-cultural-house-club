/**
 * Design philosophy: Monochrome Gazette — original Korean copy is preserved verbatim;
 * Swiss editorial grid, pure black/white, square edges, Gothic A1, and fine line icons.
 */
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Home as HomeIcon,
  Share2,
} from "lucide-react";

const HeroArtwork = "/manus-storage/nyj-hero-grid_89a9d994.png";
const MarkArtwork = "/manus-storage/nyj-mark_454f3ed0.png";
const PatternArtwork = "/manus-storage/nyj-service-pattern_d84e8296.png";
const CalendarArtwork = "/manus-storage/nyj-calendar-graphic_b00eb01a.png";

function PreviewLink({
  className,
  children,
  href = "#main-content",
  target,
}: {
  className?: string;
  children: React.ReactNode;
  href?: string;
  target?: string;
}) {
  return (
    <a className={className} href={href} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <div className="site-shell min-h-screen overflow-x-hidden bg-white text-black">
      <a className="skip-link" href="#main-content">
        본문 바로가기
      </a>

      <header className="sticky top-0 z-50 border-b border-black bg-white">
        <div className="page-width flex h-20 items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              <img src={MarkArtwork} alt="" />
              <span className="brand-mark__letter">N</span>
            </span>
            <h1 className="text-[15px] font-extrabold tracking-[-0.06em] sm:text-base">
              남양주시 문화의집 웹시스템
            </h1>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="page-width hero-layout py-12 sm:py-16 lg:py-20">
          <div className="hero-copy">
            <span className="micro-rule" aria-hidden="true" />
            <h2 className="mt-5 text-[clamp(2.55rem,6vw,5.25rem)] font-black leading-[1.02] tracking-[-0.095em]">
              문화의집 동아리
              <br />
              통합 시스템
            </h2>
            <p className="mt-7 max-w-[31rem] border-l-2 border-black pl-4 text-[15px] font-semibold leading-7 tracking-[-0.045em] sm:text-base">
              출석, 공간 예약, 외부활동을 한곳에서 관리하세요.
            </p>
          </div>

          <div className="hero-art" aria-hidden="true">
            <img src={HeroArtwork} alt="" />
            <div className="hero-art__panel">
              <span className="hero-art__line" />
              <span className="hero-art__line" />
              <span className="hero-art__line" />
            </div>
          </div>
        </section>

        <section className="border-y border-black bg-white">
          <div className="page-width py-12 sm:py-16">
            <div className="border-b border-black" />

            <nav className="service-grid mt-0" aria-label="주요 기능">
              <PreviewLink className="service-tile service-tile--dark" href="/attendance.html">
                <div className="service-topline"><span /><span className="service-icon" aria-hidden="true"><CheckCircle2 size={26} strokeWidth={1.65} /></span></div>
                <div>
                  <h3>동아리 출석부</h3>
                  <p>빠르고 정확한 출석 관리</p>
                </div>
              </PreviewLink>

              <PreviewLink className="service-tile service-tile--light" href="/booking.html">
                <span className="service-pattern" aria-hidden="true">
                  <img src={PatternArtwork} alt="" />
                </span>
                <div className="service-topline"><span /><span className="service-icon" aria-hidden="true"><CalendarDays size={26} strokeWidth={1.65} /></span></div>
                <div>
                  <h3>공간 이용 예약</h3>
                  <p>원하는 시간에 필요한 공간을 예약하세요.</p>
                  <span className="tile-action">예약하기 <ArrowRight size={17} strokeWidth={1.7} /></span>
                </div>
              </PreviewLink>

              <PreviewLink className="service-tile service-tile--light" href="/external.html">
                <div className="service-topline"><span /><span className="service-icon" aria-hidden="true"><Share2 size={26} strokeWidth={1.65} /></span></div>
                <div>
                  <h3>외부활동 공유</h3>
                  <p>다양한 활동 소식을 간편하게 등록하세요.</p>
                  <span className="tile-action">등록하기 <ArrowRight size={17} strokeWidth={1.7} /></span>
                </div>
              </PreviewLink>
            </nav>
          </div>
        </section>

        <section className="page-width py-12 sm:py-16">
          <div className="utility-grid">
            <PreviewLink className="utility-link" href="https://www.nyjcf.or.kr/www/1" target="_blank">
              <span className="utility-link__icon" aria-hidden="true">
                <HomeIcon size={24} strokeWidth={1.65} />
              </span>
              <span>남양주문화재단<span className="sr-only"> (새 창 열림)</span></span>
              <ExternalLink className="ml-auto" size={18} strokeWidth={1.65} aria-hidden="true" />
            </PreviewLink>

            <PreviewLink className="calendar-link" href="/calendar.html">
              <img className="calendar-link__art" src={CalendarArtwork} alt="" aria-hidden="true" />
              <span className="relative z-10 flex h-10 w-10 items-center justify-center border border-white" aria-hidden="true">
                <CalendarDays size={20} strokeWidth={1.65} />
              </span>
              <span className="relative z-10">동아리 활동 일정 확인</span>
              <ArrowUpRight className="relative z-10 ml-auto" size={19} strokeWidth={1.65} aria-hidden="true" />
            </PreviewLink>
          </div>

          <div className="mt-10 flex justify-center">
            <PreviewLink className="admin-link" href="/admin.html">관리자 페이지</PreviewLink>
          </div>
        </section>
      </main>

      <footer className="h-12 border-t border-black bg-black" aria-label="페이지 하단" />
    </div>
  );
}
