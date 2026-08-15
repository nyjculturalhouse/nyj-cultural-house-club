import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";

type ProgramForm = {
  externalId: string; title: string; summary: string; description: string; category: string; target: string; venue: string;
  startAt: string; endAt: string; recruitmentDeadline: string; recruitmentStatus: "upcoming" | "open" | "closing-soon" | "closed";
  applicationUrl: string; applicationProvider: "nyjcf" | "naver" | "other" | "none"; contact: string; preApplicationChecks: string; imageUrl: string; isPublished: boolean;
};

const emptyForm = (): ProgramForm => ({
  externalId: "", title: "", summary: "", description: "", category: "", target: "", venue: "", startAt: "", endAt: "", recruitmentDeadline: "", recruitmentStatus: "upcoming", applicationUrl: "", applicationProvider: "none", contact: "", preApplicationChecks: "", imageUrl: "", isPublished: false,
});

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string) { return value ? new Date(value).toISOString() : null; }

export default function ProgramAdmin() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const programsQuery = trpc.programs.adminList.useQuery(undefined, { enabled: isAdmin });
  const saveMutation = trpc.programs.adminSave.useMutation({ onSuccess: () => { utils.programs.adminList.invalidate(); utils.programs.list.invalidate(); } });
  const deleteMutation = trpc.programs.adminDelete.useMutation({ onSuccess: () => { utils.programs.adminList.invalidate(); utils.programs.list.invalidate(); } });
  const uploadMutation = trpc.programs.uploadImage.useMutation();
  const [form, setForm] = useState<ProgramForm>(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const editing = useMemo(() => programsQuery.data?.find(item => item.externalId === form.externalId), [form.externalId, programsQuery.data]);

  const update = <Key extends keyof ProgramForm>(key: Key, value: ProgramForm[Key]) => setForm(current => ({ ...current, [key]: value }));
  const startNew = () => { setForm(emptyForm()); setError(""); setNotice(""); };
  const edit = (item: NonNullable<typeof programsQuery.data>[number]) => {
    setForm({ ...item, startAt: toLocalInput(item.startAt), endAt: toLocalInput(item.endAt), recruitmentDeadline: toLocalInput(item.recruitmentDeadline) });
    setError(""); setNotice(`‘${item.title}’을 수정하고 있습니다.`);
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice("");
    if (!file.type.startsWith("image/")) { setError("JPG, PNG, WEBP 등 이미지 파일만 올릴 수 있습니다."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("사진은 5MB 이하로 준비해 주세요."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("사진을 읽을 수 없습니다.")); reader.readAsDataURL(file); });
    try {
      const result = await uploadMutation.mutateAsync({ fileName: file.name, contentType: file.type, dataUrl });
      update("imageUrl", result.url); setNotice("대표 사진을 업로드했습니다. 저장 버튼을 누르면 프로그램에 연결됩니다.");
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "사진 업로드에 실패했습니다."); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setNotice("");
    try {
      const result = await saveMutation.mutateAsync({ ...form, externalId: form.externalId.trim(), title: form.title.trim(), summary: form.summary.trim(), startAt: toIso(form.startAt), endAt: toIso(form.endAt), recruitmentDeadline: toIso(form.recruitmentDeadline) });
      setNotice(result.created ? "새 프로그램을 저장했습니다." : "프로그램 정보를 수정했습니다.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "프로그램 저장에 실패했습니다."); }
  };

  const remove = async () => {
    if (!editing || !window.confirm(`‘${editing.title}’ 프로그램을 삭제할까요?`)) return;
    try { await deleteMutation.mutateAsync({ externalId: editing.externalId }); startNew(); setNotice("프로그램을 삭제했습니다."); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "프로그램 삭제에 실패했습니다."); }
  };

  if (loading) return <div className="program-admin-gate">관리자 정보를 확인하고 있습니다.</div>;
  if (!user) return <div className="program-admin-gate"><div><p className="reference-label"><span />관리자</p><h1>프로그램 관리</h1><p>프로그램 정보와 대표 사진을 등록하려면 관리자 로그인이 필요합니다.</p><button onClick={() => startLogin()} className="reference-button">관리자 로그인</button></div></div>;
  if (!isAdmin) return <div className="program-admin-gate"><div><p className="reference-label"><span />접근 제한</p><h1>관리자 권한이 필요합니다.</h1><p>현재 계정에는 프로그램을 등록하거나 사진을 올릴 권한이 없습니다.</p><Link href="/" className="reference-text-button">메인으로 돌아가기</Link></div></div>;

  return <main className="program-admin-page"><header className="program-admin-header"><Link href="/" className="reference-brand" aria-label="메인으로 이동"><span className="reference-brand__mark"><b>N</b></span><span><strong>남양주시 문화의집</strong><small>프로그램 관리</small></span></Link><Link href="/programs" className="reference-text-button">공개 화면 보기</Link></header><div className="program-admin-layout"><aside className="program-admin-list"><div className="program-admin-list__heading"><div><p className="reference-label"><span />등록 목록</p><h1>프로그램</h1></div><button className="program-admin-icon-button" onClick={startNew} aria-label="새 프로그램 등록"><Plus size={19} /></button></div>{programsQuery.isLoading && <p className="program-admin-empty">목록을 불러오는 중입니다.</p>}{programsQuery.isError && <p className="program-admin-error">목록을 불러오지 못했습니다. 관리자 권한을 확인해 주세요.</p>}{programsQuery.data?.length === 0 && <p className="program-admin-empty">등록한 프로그램이 없습니다.<br />오른쪽에서 첫 프로그램을 등록하세요.</p>}<div className="program-admin-list__items">{programsQuery.data?.map(item => <button type="button" key={item.externalId} onClick={() => edit(item)} className={form.externalId === item.externalId ? "is-selected" : ""}><span>{item.isPublished ? "공개" : "비공개"}</span><strong>{item.title}</strong><small>{item.summary}</small><Pencil size={15} /></button>)}</div></aside><section className="program-admin-form-wrap"><div className="program-admin-form__heading"><div><p className="reference-label"><span />{editing ? "수정" : "새 등록"}</p><h1>{editing ? "프로그램 수정" : "프로그램 등록"}</h1></div>{editing && <button type="button" className="program-admin-delete" onClick={remove} disabled={deleteMutation.isPending}><Trash2 size={16} /> 삭제</button>}</div><form className="program-admin-form" onSubmit={submit}><div className="program-admin-form__photo"><div className="program-admin-photo-preview">{form.imageUrl ? <img src={form.imageUrl} alt="선택한 프로그램 대표 사진" /> : <><ImagePlus size={34} /><span>대표 사진 미등록</span></>}</div><div><strong>대표 사진</strong><p>JPG, PNG, WEBP 파일을 5MB 이하로 올려 주세요.</p><label className="program-admin-upload"><Upload size={16} />{uploadMutation.isPending ? "업로드 중" : "사진 선택"}<input type="file" accept="image/*" onChange={uploadImage} disabled={uploadMutation.isPending} /></label>{form.imageUrl && <button type="button" className="program-admin-clear-image" onClick={() => update("imageUrl", "")}>사진 연결 해제</button>}</div></div><div className="program-admin-grid"><label>프로그램 ID <input required disabled={Boolean(editing)} value={form.externalId} onChange={e => update("externalId", e.target.value.toLowerCase())} placeholder="2026-autumn-ceramic" /><small>영문·숫자·하이픈만 사용합니다.</small></label><label>공개 상태 <select value={form.isPublished ? "published" : "draft"} onChange={e => update("isPublished", e.target.value === "published")}><option value="draft">비공개(작성 중)</option><option value="published">공개</option></select></label><label className="program-admin-span-2">프로그램 제목 <input required value={form.title} onChange={e => update("title", e.target.value)} placeholder="가을 도자기 교실" /></label><label className="program-admin-span-2">한 줄 소개 <input required value={form.summary} onChange={e => update("summary", e.target.value)} placeholder="흙으로 만드는 나만의 생활 소품" /></label><label>주제 <input value={form.category} onChange={e => update("category", e.target.value)} placeholder="문화예술" /></label><label>대상 <input value={form.target} onChange={e => update("target", e.target.value)} placeholder="성인" /></label><label className="program-admin-span-2">장소 <input value={form.venue} onChange={e => update("venue", e.target.value)} placeholder="남양주시 문화의집" /></label><label>시작 일시 <input type="datetime-local" value={form.startAt} onChange={e => update("startAt", e.target.value)} /></label><label>종료 일시 <input type="datetime-local" value={form.endAt} onChange={e => update("endAt", e.target.value)} /></label><label>모집 마감일 <input type="datetime-local" value={form.recruitmentDeadline} onChange={e => update("recruitmentDeadline", e.target.value)} /></label><label>모집 상태 <select value={form.recruitmentStatus} onChange={e => update("recruitmentStatus", e.target.value as ProgramForm["recruitmentStatus"])}><option value="upcoming">예정</option><option value="open">모집 중</option><option value="closing-soon">마감 임박</option><option value="closed">마감</option></select></label><label>신청처 <select value={form.applicationProvider} onChange={e => update("applicationProvider", e.target.value as ProgramForm["applicationProvider"])}><option value="none">신청 링크 준비 중</option><option value="nyjcf">남양주문화재단</option><option value="naver">네이버폼</option><option value="other">기타 공식 접수처</option></select></label><label>공식 신청 링크 <input type="url" value={form.applicationUrl} onChange={e => update("applicationUrl", e.target.value)} placeholder="https://" /></label><label className="program-admin-span-2">문의처 <input value={form.contact} onChange={e => update("contact", e.target.value)} placeholder="문화의집 담당자 031-000-0000" /></label><label className="program-admin-span-2">상세 소개 <textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="프로그램 내용, 준비물, 유의사항을 입력하세요." /></label><label className="program-admin-span-2">신청 전 확인 <textarea value={form.preApplicationChecks} onChange={e => update("preApplicationChecks", e.target.value)} placeholder="한 줄에 한 항목씩 입력하세요. 예: 일정 확인" /></label></div>{notice && <p className="program-admin-notice" role="status">{notice}</p>}{error && <p className="program-admin-error" role="alert">{error}</p>}<div className="program-admin-form__actions"><button type="button" className="reference-text-button" onClick={startNew}>새로 작성</button><button className="reference-button" disabled={saveMutation.isPending || uploadMutation.isPending}><Save size={17} />{saveMutation.isPending ? "저장 중" : "프로그램 저장"}</button></div></form></section></div></main>;
}
