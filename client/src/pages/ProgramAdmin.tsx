import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { BarChart3, CalendarCheck, Check, ChevronRight, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type ProgramForm = {
  externalId: string; title: string; summary: string; description: string; category: string; target: string; venue: string;
  startAt: string; endAt: string; recruitmentDeadline: string; recruitmentStatus: "upcoming" | "open" | "closing-soon" | "closed";
  applicationUrl: string; applicationProvider: "nyjcf" | "naver" | "other" | "none"; contact: string; preApplicationChecks: string; imageUrl: string; isPublished: boolean;
};

type SheetRow = ProgramForm & { key: string; persisted: boolean; isExample: boolean };
type AdminTab = "attendance" | "programs";

const newKey = () => `program-row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const blankRow = (): SheetRow => ({ key: newKey(), persisted: false, isExample: false, externalId: "", title: "", summary: "", description: "", category: "", target: "", venue: "", startAt: "", endAt: "", recruitmentDeadline: "", recruitmentStatus: "upcoming", applicationUrl: "", applicationProvider: "none", contact: "", preApplicationChecks: "", imageUrl: "", isPublished: false });
const exampleRow = (): SheetRow => ({ key: newKey(), persisted: false, isExample: true, externalId: "example-weekend-pottery", title: "[입력 예시] 주말 생활 도자기", summary: "흙으로 만드는 나만의 생활 소품", description: "처음 참여하는 분도 기초부터 함께 만드는 생활 도자기 프로그램입니다.", category: "문화예술", target: "성인", venue: "남양주시 문화의집 공방", startAt: "2026-09-12T14:00", endAt: "2026-09-12T16:00", recruitmentDeadline: "2026-09-08T18:00", recruitmentStatus: "open", applicationUrl: "", applicationProvider: "none", contact: "031-000-0000", preApplicationChecks: "재료 준비를 위해 사전 신청이 필요합니다.\n편한 복장으로 참여해 주세요.", imageUrl: "", isPublished: false });
const toLocalInput = (value: string | null) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "";
const toIso = (value: string) => value ? new Date(value).toISOString() : null;
const dateText = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

async function readImageDimensions(dataUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("사진 크기를 읽을 수 없습니다."));
    image.src = dataUrl;
  });
}

export default function ProgramAdmin() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [tab, setTab] = useState<AdminTab>("attendance");
  const [month] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }));
  const utils = trpc.useUtils();
  const attendanceQuery = trpc.attendance.status.useQuery(undefined, { enabled: isAdmin });
  const monthlyQuery = trpc.attendance.monthlyStatus.useQuery(month, { enabled: isAdmin });
  const programsQuery = trpc.programs.adminList.useQuery(undefined, { enabled: isAdmin });
  const saveMutation = trpc.programs.adminSave.useMutation({ onSuccess: () => { utils.programs.adminList.invalidate(); utils.programs.list.invalidate(); } });
  const deleteMutation = trpc.programs.adminDelete.useMutation({ onSuccess: () => { utils.programs.adminList.invalidate(); utils.programs.list.invalidate(); } });
  const uploadMutation = trpc.programs.uploadImage.useMutation();
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!programsQuery.data) return;
    setRows(programsQuery.data.length === 0 ? [exampleRow()] : programsQuery.data.map(item => ({ ...item, key: item.externalId, persisted: true, isExample: false, startAt: toLocalInput(item.startAt), endAt: toLocalInput(item.endAt), recruitmentDeadline: toLocalInput(item.recruitmentDeadline) })));
  }, [programsQuery.data]);

  const attendance = attendanceQuery.data ?? [];
  const submittedCount = attendance.filter(item => item.thisWeek).length;
  const lastSubmittedCount = attendance.filter(item => item.lastWeek).length;
  const monthlyWeeks = monthlyQuery.data?.statuses.flatMap(item => item.weeks) ?? [];
  const monthlyCompletedCount = monthlyWeeks.filter(week => week.completed).length;
  const rowCountLabel = useMemo(() => `${rows.length}개 프로그램`, [rows.length]);
  const updateRow = <Key extends keyof ProgramForm>(key: string, field: Key, value: ProgramForm[Key]) => setRows(current => current.map(row => row.key === key ? { ...row, [field]: value } : row));
  const addRow = () => { setRows(current => [...current, blankRow()]); setNotice("새 행을 추가했습니다. 필수 칸을 채운 뒤 저장하세요."); setError(""); };
  const addExampleRow = () => { setRows(current => current.some(row => row.isExample) ? current : [...current, exampleRow()]); setNotice("저장 전 입력 예시 행을 추가했습니다. 내용을 바꾼 뒤 저장하면 실제 프로그램으로 등록됩니다."); setError(""); };

  const uploadImage = async (key: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(""); setNotice("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("대표 사진은 JPG, PNG, WEBP 파일만 올릴 수 있습니다."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("사진은 5MB 이하로 준비해 주세요."); return; }
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("사진을 읽을 수 없습니다.")); reader.readAsDataURL(file); });
    const dimensions = await readImageDimensions(dataUrl);
    if (Math.abs(dimensions.width / dimensions.height - (4 / 5)) > 0.015) { setError("대표 사진은 가로 1080px · 세로 1350px과 같은 4:5 세로 비율로 준비해 주세요."); return; }
    try { const result = await uploadMutation.mutateAsync({ fileName: file.name, contentType: file.type, dataUrl }); updateRow(key, "imageUrl", result.url); setNotice("사진을 올렸습니다. 해당 행의 저장 버튼을 눌러 프로그램에 연결하세요."); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "사진 업로드에 실패했습니다."); }
  };

  const saveRow = async (row: SheetRow) => {
    setError(""); setNotice("");
    if (!row.externalId.trim() || !row.title.trim() || !row.summary.trim()) { setError("프로그램 ID, 제목, 한 줄 소개는 반드시 입력해 주세요."); return; }
    try {
      const result = await saveMutation.mutateAsync({ ...row, externalId: row.externalId.trim(), title: row.title.trim(), summary: row.summary.trim(), startAt: toIso(row.startAt), endAt: toIso(row.endAt), recruitmentDeadline: toIso(row.recruitmentDeadline) });
      setRows(current => current.map(item => item.key === row.key ? { ...item, key: row.externalId.trim(), externalId: row.externalId.trim(), persisted: true, isExample: false } : item));
      setNotice(result.created ? `‘${row.title}’ 프로그램을 저장했습니다.` : `‘${row.title}’ 프로그램을 수정했습니다.`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "프로그램 저장에 실패했습니다."); }
  };

  const removeRow = async (row: SheetRow) => {
    if (!row.persisted) { setRows(current => current.filter(item => item.key !== row.key)); return; }
    if (!window.confirm(`‘${row.title}’ 프로그램을 삭제할까요?`)) return;
    try { await deleteMutation.mutateAsync({ externalId: row.externalId }); setRows(current => current.filter(item => item.key !== row.key)); setNotice("프로그램을 삭제했습니다."); }
    catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "프로그램 삭제에 실패했습니다."); }
  };

  if (loading) return <div className="program-admin-gate">관리자 정보를 확인하고 있습니다.</div>;
  if (!user) return <div className="program-admin-gate"><div><p className="reference-label"><span />관리자</p><h1>운영 관리</h1><p>동아리 출석과 프로그램을 관리하려면 문화의집 프로젝트 소유자 계정으로 로그인해 주세요.</p><button onClick={() => startLogin()} className="reference-button">관리자 로그인</button></div></div>;
  if (!isAdmin) return <div className="program-admin-gate"><div><p className="reference-label"><span />접근 제한</p><h1>관리자 권한이 필요합니다.</h1><p>현재 계정에는 출석 현황을 보거나 프로그램을 등록할 권한이 없습니다. 문화의집 프로젝트를 만든 계정으로 다시 로그인해 주세요.</p><Link href="/" className="reference-text-button">메인으로 돌아가기</Link></div></div>;

  return <main className="program-admin-page"><header className="program-admin-header"><Link href="/" className="reference-brand" aria-label="메인으로 이동"><span className="reference-brand__mark"><b>N</b></span><span><strong>남양주시 문화의집</strong><small>운영 관리</small></span></Link><Link href="/programs" className="reference-text-button">공개 화면 보기</Link></header><section className="program-sheet-shell"><div className="program-sheet-heading"><div><p className="reference-label"><span />관리자</p><h1>운영 관리</h1><p>동아리 출석 완료 여부를 먼저 확인하고, 프로그램은 시트처럼 직접 입력·저장하세요.</p></div></div><div className="program-admin-tabs" role="tablist" aria-label="관리자 기능"><button type="button" role="tab" aria-selected={tab === "attendance"} className={tab === "attendance" ? "is-active" : ""} onClick={() => setTab("attendance")}><BarChart3 size={18} /> 출석 현황</button><button type="button" role="tab" aria-selected={tab === "programs"} className={tab === "programs" ? "is-active" : ""} onClick={() => setTab("programs")}><CalendarCheck size={18} /> 프로그램 시트</button></div>{tab === "attendance" && <section className="attendance-admin" aria-labelledby="attendance-admin-title"><div className="attendance-admin__heading"><div><p className="reference-label"><span />이번 주</p><h2 id="attendance-admin-title">동아리 출석 확인</h2><p>이번 주 출석을 완료한 동아리와 아직 제출하지 않은 동아리를 한눈에 확인합니다.</p></div><Link href="/monthly-attendance" className="reference-text-button">이번 달 출석 자세히 보기 <ChevronRight size={16} /></Link></div>{attendanceQuery.isLoading && <p className="program-sheet-state"><Loader2 className="animate-spin" size={18} /> 출석 현황을 불러오는 중입니다.</p>}{attendanceQuery.isError && <p className="program-sheet-state program-sheet-state--error">출석 현황을 불러오지 못했습니다. 잠시 뒤 다시 확인해 주세요.</p>}{!attendanceQuery.isLoading && !attendanceQuery.isError && <><div className="attendance-admin__metrics"><div><small>등록 동아리</small><strong>{attendance.length}<em>개</em></strong></div><div><small>이번 주 출석 완료</small><strong>{submittedCount}<em>개</em></strong><span>{attendance.length ? Math.round((submittedCount / attendance.length) * 100) : 0}%</span></div><div><small>이번 달 완료 기록</small><strong>{monthlyCompletedCount}<em>건</em></strong><span>{month.year}년 {month.month}월</span></div><div><small>지난주 출석 완료</small><strong>{lastSubmittedCount}<em>개</em></strong></div></div><div className="attendance-admin__table-wrap"><table className="attendance-admin__table"><caption>동아리별 출석 완료 현황</caption><thead><tr><th>동아리</th><th>지난주</th><th>이번 주</th><th>안내</th></tr></thead><tbody>{attendance.length === 0 && <tr><td colSpan={4}>등록된 동아리 출석 현황이 없습니다.</td></tr>}{attendance.map(item => <tr key={item.club}><td>{item.club}</td><td>{item.lastWeek ? <span className="attendance-state is-complete"><Check size={15} /> 완료</span> : <span className="attendance-state">미완료</span>}</td><td>{item.thisWeek ? <span className="attendance-state is-complete"><Check size={15} /> 완료</span> : <span className="attendance-state">미완료</span>}</td><td>{item.thisWeek ? "이번 주 출석이 등록되었습니다." : "출석부에서 인원을 입력해 등록하세요."}</td></tr>)}</tbody></table></div></>}</section>}{tab === "programs" && <section className="program-sheet-section" aria-labelledby="program-sheet-title"><div className="program-sheet-heading program-sheet-heading--inner"><div><p className="reference-label"><span />프로그램 입력</p><h2 id="program-sheet-title">프로그램 시트</h2><p>각 행에서 내용을 바꾸고 <b>저장</b>을 누르면 반영됩니다. 사진은 1080×1350px(4:5) 세로형으로 올려 주세요.</p></div><div className="program-sheet-heading__actions"><span>{rowCountLabel}</span><button type="button" className="reference-text-button" onClick={addExampleRow}>입력 예시 추가</button><button type="button" className="reference-button" onClick={addRow}><Plus size={17} /> 새 행 추가</button></div></div>{programsQuery.isLoading && <p className="program-sheet-state"><Loader2 className="animate-spin" size={18} /> 프로그램 행을 불러오는 중입니다.</p>}{programsQuery.isError && <p className="program-sheet-state program-sheet-state--error">목록을 불러오지 못했습니다. 관리자 권한을 확인해 주세요.</p>}{!programsQuery.isLoading && <div className="program-sheet-scroll"><table className="program-sheet"><caption>프로그램 등록과 수정용 시트</caption><thead><tr><th>사진<br /><small>4:5</small></th><th>상태</th><th>공개</th><th>프로그램 ID</th><th>프로그램 제목</th><th>한 줄 소개</th><th>주제</th><th>대상</th><th>장소</th><th>시작 일시</th><th>종료 일시</th><th>모집 마감</th><th>모집 상태</th><th>신청처</th><th>공식 신청 링크</th><th>문의처</th><th>상세 소개</th><th>신청 전 확인</th><th>저장</th><th>삭제</th></tr></thead><tbody>{rows.length === 0 && <tr><td colSpan={20} className="program-sheet-empty">등록한 프로그램이 없습니다. <button type="button" onClick={addExampleRow}>입력 예시 추가</button> 또는 <button type="button" onClick={addRow}>첫 행 추가</button>로 시작하세요.</td></tr>}{rows.map(row => <tr key={row.key} className={row.isExample ? "is-example" : ""}><td><label className="program-sheet-image">{row.imageUrl ? <img src={row.imageUrl} alt={`${row.title || "프로그램"} 대표 사진`} /> : <span><ImagePlus size={20} />사진</span>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => uploadImage(row.key, event)} disabled={uploadMutation.isPending} /></label></td><td>{row.isExample ? <span className="program-sheet-example">예시<br />저장 전</span> : <span className="program-sheet-row-state">{row.persisted ? "저장됨" : "새 행"}</span>}</td><td><select aria-label={`${row.title || "새 프로그램"} 공개 상태`} value={row.isPublished ? "published" : "draft"} onChange={event => updateRow(row.key, "isPublished", event.target.value === "published")}><option value="draft">비공개</option><option value="published">공개</option></select></td><td><input aria-label="프로그램 ID" value={row.externalId} disabled={row.persisted} onChange={event => updateRow(row.key, "externalId", event.target.value.toLowerCase())} placeholder="2026-autumn" /></td><td><input aria-label="프로그램 제목" value={row.title} onChange={event => updateRow(row.key, "title", event.target.value)} placeholder="프로그램 제목" /></td><td><input aria-label="한 줄 소개" value={row.summary} onChange={event => updateRow(row.key, "summary", event.target.value)} placeholder="한 줄 소개" /></td><td><input aria-label="주제" value={row.category} onChange={event => updateRow(row.key, "category", event.target.value)} placeholder="문화예술" /></td><td><input aria-label="대상" value={row.target} onChange={event => updateRow(row.key, "target", event.target.value)} placeholder="성인" /></td><td><input aria-label="장소" value={row.venue} onChange={event => updateRow(row.key, "venue", event.target.value)} placeholder="문화의집" /></td><td><input aria-label="시작 일시" type="datetime-local" value={row.startAt} onChange={event => updateRow(row.key, "startAt", event.target.value)} /></td><td><input aria-label="종료 일시" type="datetime-local" value={row.endAt} onChange={event => updateRow(row.key, "endAt", event.target.value)} /></td><td><input aria-label="모집 마감일" type="datetime-local" value={row.recruitmentDeadline} onChange={event => updateRow(row.key, "recruitmentDeadline", event.target.value)} /></td><td><select aria-label="모집 상태" value={row.recruitmentStatus} onChange={event => updateRow(row.key, "recruitmentStatus", event.target.value as ProgramForm["recruitmentStatus"])}><option value="upcoming">예정</option><option value="open">모집 중</option><option value="closing-soon">마감 임박</option><option value="closed">마감</option></select></td><td><select aria-label="신청처" value={row.applicationProvider} onChange={event => updateRow(row.key, "applicationProvider", event.target.value as ProgramForm["applicationProvider"])}><option value="none">준비 중</option><option value="nyjcf">문화재단</option><option value="naver">네이버폼</option><option value="other">기타</option></select></td><td><input aria-label="공식 신청 링크" type="url" value={row.applicationUrl} onChange={event => updateRow(row.key, "applicationUrl", event.target.value)} placeholder="https://" /></td><td><input aria-label="문의처" value={row.contact} onChange={event => updateRow(row.key, "contact", event.target.value)} placeholder="031-000-0000" /></td><td><textarea aria-label="상세 소개" value={row.description} onChange={event => updateRow(row.key, "description", event.target.value)} placeholder="상세 소개" /></td><td><textarea aria-label="신청 전 확인" value={row.preApplicationChecks} onChange={event => updateRow(row.key, "preApplicationChecks", event.target.value)} placeholder="한 줄에 한 항목" /></td><td><button type="button" className="program-sheet-save" onClick={() => saveRow(row)} disabled={saveMutation.isPending || uploadMutation.isPending}><Save size={16} /> 저장</button></td><td><button type="button" className="program-sheet-delete" onClick={() => removeRow(row)} disabled={deleteMutation.isPending}><Trash2 size={16} /><span className="sr-only">삭제</span></button></td></tr>)}</tbody></table></div>}</section>}{notice && <p className="program-sheet-notice" role="status">{notice}</p>}{error && <p className="program-sheet-notice program-sheet-notice--error" role="alert">{error}</p>}</section></main>;
}
