import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Check, Users } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

function usePortalAfter(selector: string, className: string, enabled: boolean) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTarget(null);
      return;
    }

    let container: HTMLDivElement | null = null;
    const place = () => {
      const anchor = document.querySelector<HTMLElement>(selector);
      if (!anchor) return;
      if (container?.isConnected) return;
      container = document.createElement("div");
      container.className = className;
      anchor.insertAdjacentElement("afterend", container);
      setTarget(container);
    };
    const observer = new MutationObserver(place);
    observer.observe(document.body, { childList: true, subtree: true });
    place();
    return () => {
      observer.disconnect();
      container?.remove();
      setTarget(null);
    };
  }, [className, enabled, selector]);

  return target;
}

function formatRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const startLabel = startDate.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  const endLabel = endDate.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  return `${startLabel}–${endLabel}`;
}

export function AdminAttendanceHeadcount() {
  const [location] = useLocation();
  const { user } = useAuth();
  const enabled = location === "/program-admin" && user?.role === "admin";
  const summaryQuery = trpc.attendance.headcountSummary.useQuery(undefined, { enabled, retry: false });
  const target = usePortalAfter(".attendance-admin__metrics", "admin-headcount-summary-host", enabled);

  if (!target || summaryQuery.isLoading) return null;
  if (summaryQuery.isError) {
    return createPortal(<p className="admin-headcount-unavailable">참석 인원 통계는 Google Apps Script 최신 배포 후 표시됩니다.</p>, target);
  }
  if (!summaryQuery.data) return null;

  const summary = summaryQuery.data;
  return createPortal(
    <section className="admin-headcount-summary" aria-labelledby="attendance-headcount-title">
      <div className="admin-headcount-summary__heading">
        <div>
          <p className="reference-label"><span />참석 인원</p>
          <h3 id="attendance-headcount-title">누적 참석 인원</h3>
          <p>동일한 사람이 다른 주에 출석한 경우 출석 횟수만큼 합산합니다.</p>
        </div>
        <Users size={23} aria-hidden="true" />
      </div>
      <div className="admin-headcount-summary__metrics">
        <div><small>이번 주</small><strong>{summary.currentWeek.attendees}<em>명</em></strong><span>{formatRange(summary.currentWeek.start, summary.currentWeek.end)}</span></div>
        <div><small>{summary.month}월 누적</small><strong>{summary.monthAttendees}<em>명</em></strong><span>{summary.year}년 {summary.month}월</span></div>
        <div><small>{summary.year}년 누적</small><strong>{summary.yearAttendees}<em>명</em></strong><span>올해 전체</span></div>
      </div>
      <div className="admin-headcount-summary__weeks" aria-label={`${summary.month}월 주차별 참석 인원`}>
        {summary.weeks.map(week => <span key={week.index}><b>{week.index}주</b>{week.attendees}명</span>)}
      </div>
    </section>,
    target,
  );
}

export function AdminProgramEntryGuidance() {
  const [location] = useLocation();
  const { user } = useAuth();
  const enabled = location === "/program-admin" && user?.role === "admin";
  const target = usePortalAfter(".program-sheet-heading--inner", "admin-program-guidance-host", enabled);
  if (!target) return null;
  return createPortal(
    <aside className="admin-program-guidance">
      <strong>등록 필수</strong><span>프로그램 제목</span>
      <strong>자동 보완</strong><span>프로그램 ID와 한 줄 소개는 비워 두면 제목을 기준으로 자동 생성됩니다.</span>
      <strong>상세 입력은 선택</strong><span>사진, 장소, 대상, 일정, 신청 링크, 상세 소개는 저장 후에도 <b>상세 편집</b>에서 보완할 수 있습니다.</span>
    </aside>,
    target,
  );
}

type SaveFeedback = { title: string; message: string };

export function ProgramSaveSuccessDialog() {
  const [location] = useLocation();
  const [feedback, setFeedback] = useState<SaveFeedback | null>(null);
  const previousNotice = useRef("");

  useEffect(() => {
    if (location !== "/program-admin") return;
    const inspectNotice = () => {
      const notice = document.querySelector<HTMLElement>(".program-sheet-notice:not(.program-sheet-notice--error)");
      const message = notice?.textContent?.trim() ?? "";
      if (!message) {
        previousNotice.current = "";
        return;
      }
      if (message === previousNotice.current) return;
      previousNotice.current = message;
      if (message.includes("프로그램을 저장했습니다.")) setFeedback({ title: "프로그램 등록 완료", message: "프로그램 기본 정보가 저장되었습니다. 사진·장소·신청 링크 등은 필요할 때 상세 편집에서 추가할 수 있습니다." });
      else if (message.includes("프로그램을 수정했습니다.")) setFeedback({ title: "프로그램 수정 완료", message: "변경한 프로그램 정보가 저장되었습니다." });
      else if (message.includes("프로그램 행을 한꺼번에 저장했습니다.")) setFeedback({ title: "프로그램 일괄 저장 완료", message: message });
    };
    const observer = new MutationObserver(inspectNotice);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    inspectNotice();
    return () => observer.disconnect();
  }, [location]);

  return <Dialog open={Boolean(feedback)} onOpenChange={open => { if (!open) setFeedback(null); }}>
    <DialogContent className="rounded-none border-black text-black" showCloseButton={false}>
      <DialogHeader>
        <span className="admin-save-dialog__mark"><Check size={20} /></span>
        <DialogTitle className="text-2xl font-extrabold tracking-[-.05em]">{feedback?.title}</DialogTitle>
        <DialogDescription className="text-sm leading-6 text-black">{feedback?.message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <button type="button" className="reference-button admin-save-dialog__button" onClick={() => setFeedback(null)}>확인</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
