import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, ImageOff, MapPin, Users, X } from "lucide-react";

export type ProgramPreviewRow = {
  title: string;
  summary: string;
  description: string;
  category: string;
  target: string;
  venue: string;
  startAt: string;
  imageUrl: string;
  applicationUrl: string;
  isPublished: boolean;
};

function dateLabel(value: string) {
  if (!value) return "일정 준비 중";
  return new Date(value).toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ProgramDraftPreviewDialog({ row, onClose }: { row: ProgramPreviewRow | null; onClose: () => void }) {
  return <Dialog open={Boolean(row)} onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="program-preview-dialog rounded-none border-black p-0 text-black" showCloseButton={false}>
      <div className="program-preview-dialog__topline"><span>공개 전 미리보기</span><button type="button" onClick={onClose} aria-label="미리보기 닫기"><X size={18} /></button></div>
      <div className="program-preview-dialog__body">
        <div className="program-preview-dialog__image">{row?.imageUrl ? <img src={row.imageUrl} alt={`${row.title || "프로그램"} 대표 사진 미리보기`} /> : <span><ImageOff size={28} />대표 사진 미등록</span>}</div>
        <div className="program-preview-dialog__content">
          <p className="reference-label"><span />{row?.isPublished ? "공개 예정" : "임시저장"}</p>
          <DialogHeader className="gap-2 text-left"><DialogTitle className="program-preview-dialog__title">{row?.title || "프로그램 제목"}</DialogTitle><DialogDescription className="program-preview-dialog__summary">{row?.summary || "한 줄 소개가 여기에 표시됩니다."}</DialogDescription></DialogHeader>
          <div className="program-preview-dialog__meta"><span><CalendarDays size={16} />{dateLabel(row?.startAt || "")}</span>{row?.venue && <span><MapPin size={16} />{row.venue}</span>}{row?.target && <span><Users size={16} />{row.target}</span>}</div>
          {row?.category && <span className="program-preview-dialog__category">{row.category}</span>}
          <p className="program-preview-dialog__description">{row?.description || "상세 소개를 입력하면 공개 페이지에서 이 영역에 표시됩니다."}</p>
          <div className="program-preview-dialog__application">{row?.applicationUrl ? "공식 신청 링크 버튼이 표시됩니다." : "신청 링크를 입력하면 공식 신청 버튼이 표시됩니다."}</div>
        </div>
      </div>
      <DialogFooter className="program-preview-dialog__footer"><button type="button" className="reference-button" onClick={onClose}>작성으로 돌아가기</button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
