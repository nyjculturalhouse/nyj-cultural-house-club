export const GAS_URL = "https://script.google.com/macros/s/AKfycbz6jMx_mhQPB8j-QmY0yTPFoND907gRNMHqttgtbv1f1J69lx2rtJ4gFUNNta601yDolg/exec";

export async function gasGet(mode, params = {}) {
  const query = new URLSearchParams({ mode, ...params });
  const response = await fetch(`${GAS_URL}?${query.toString()}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload.error);
  return payload;
}

export async function gasPost(payload) {
  const response = await fetch(GAS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Apps Script 응답을 읽지 못했습니다."); }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function formatDate(value) {
  if (!value) return "일정 미입력";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR", { month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" });
}

export function imageMarkup(program) {
  return program.imageUrl ? `<img src="${program.imageUrl}" alt="${program.title} 대표 사진">` : `<div class="image-empty">대표 사진 준비 중</div>`;
}
