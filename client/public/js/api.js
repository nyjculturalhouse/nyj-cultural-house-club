/**
 * api.js
 * Google Apps Script(GAS) 백엔드와 통신하는 공통 GET/POST 함수입니다.
 */
const API_URL = "https://script.google.com/macros/s/AKfycbw8TIvA_grDjk0Lu98nSh3gplAUBHezY5rp5ANDlxu4Fk7b2x6VRd0Lbw6wgFNA-NvL9A/exec";

/**
 * GET 요청
 * @param {string} mode - GAS doGet 라우팅용 모드명
 * @param {Object} params - 추가 쿼리 파라미터
 */
async function apiGet(mode, params = {}) {
    const query = new URLSearchParams({ mode, ...params });

    try {
        const res = await fetch(`${API_URL}?${query.toString()}`);
        return await res.json();
    } catch (e) {
        console.error("GET error", e);
        return null;
    }
}

/**
 * POST 요청
 * GAS의 CORS Preflight 제약을 피하기 위해 text/plain 컨텐츠 타입으로 전송합니다.
 * @param {Object} data - 전송할 payload (mode 필드를 포함해야 합니다)
 */
async function apiPost(data) {
    const honeypotEl = document.getElementById('honeypot');
    const honeypotValue = honeypotEl ? honeypotEl.value : "";

    const payload = {
        ...data,
        honeypot: honeypotValue
    };

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            redirect: "follow",
            body: JSON.stringify(payload)
        });

        const text = await res.text();

        try {
            return JSON.parse(text);
        } catch {
            console.warn("Non-JSON response:", text);
            return { error: "서버 응답 오류" };
        }
    } catch (e) {
        console.error("POST error", e);
        return { error: "네트워크 오류" };
    }
}

window.apiGet = apiGet;
window.apiPost = apiPost;
