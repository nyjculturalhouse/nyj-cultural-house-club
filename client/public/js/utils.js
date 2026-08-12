/**
 * utils.js
 * 여러 페이지에서 중복 구현되어 있던 헬퍼 함수를 한 곳으로 모았습니다.
 * - getOrCreateUID          (app.js / booking.html / external.html 중복 제거)
 * - formatPhoneNumber       (booking.html / external.html 중복 제거)
 * - formatKoreanDateTime    (calendar.html / booking.html 중복 제거)
 * - KRDSModal               접근성을 고려한 공통 모달 컨트롤러
 * - KRDSToast               공통 토스트 컨트롤러
 */

/* -----------------------------
   사용자 고유 ID
------------------------------ */
function getOrCreateUID() {
    let uid = localStorage.getItem("user_unique_id");
    if (!uid) {
        uid = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem("user_unique_id", uid);
    }
    return uid;
}

/* -----------------------------
   전화번호 자동 하이픈 포맷
------------------------------ */
function formatPhoneNumber(value) {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 8) {
        return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
}

/** input 요소에 전화번호 자동 하이픈 포맷을 붙여줍니다. */
function bindPhoneAutoFormat(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener('input', (e) => {
        e.target.value = formatPhoneNumber(e.target.value);
    });
}

/* -----------------------------
   날짜/시간 한국어 포맷
------------------------------ */
function formatKoreanDateTime(dateStr, isAllDay) {
    if (!dateStr) return "-";
    try {
        const cleanStr = dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T");
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return dateStr;

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');

        if (isAllDay === true || isAllDay === "true") {
            return `${year}년 ${month}월 ${day}일 (종일)`;
        }
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    } catch (e) {
        console.error("날짜 변환 실패:", e);
        return dateStr;
    }
}

/** 폼 필수값 검증 실패 시, alert 대신 화면 낭독기에도 전달되는 안내를 띄웁니다. */
function announce(message) {
    let live = document.getElementById('krds-live-region');
    if (!live) {
        live = document.createElement('div');
        live.id = 'krds-live-region';
        live.setAttribute('role', 'status');
        live.setAttribute('aria-live', 'polite');
        live.className = 'sr-only';
        document.body.appendChild(live);
    }
    live.textContent = '';
    // 동일 문구 연속 발화를 위해 한 틱 뒤에 채워 넣습니다.
    requestAnimationFrame(() => { live.textContent = message; });
}

/* -----------------------------
   접근성 모달 컨트롤러
   - role="dialog" aria-modal="true" 요소를 열고 닫을 때
     포커스를 모달 내부로 이동시키고, 닫을 때는 트리거로 되돌립니다.
   - ESC 키로 닫기, 배경 클릭으로 닫기를 지원합니다.
------------------------------ */
const KRDSModal = (() => {
    let lastFocusedEl = null;

    function getFocusable(modalEl) {
        return Array.from(modalEl.querySelectorAll(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
    }

    function open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        lastFocusedEl = document.activeElement;
        modal.classList.remove('hidden');
        // 트랜지션을 위해 한 틱 뒤 open 클래스 부여
        requestAnimationFrame(() => modal.classList.add('is-open'));

        const focusables = getFocusable(modal);
        if (focusables.length) focusables[0].focus();

        function onKeydown(e) {
            if (e.key === 'Escape') {
                close(modalId);
            } else if (e.key === 'Tab' && focusables.length) {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        modal._krdsKeydownHandler = onKeydown;
        document.addEventListener('keydown', onKeydown);
    }

    function close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('is-open');
        if (modal._krdsKeydownHandler) {
            document.removeEventListener('keydown', modal._krdsKeydownHandler);
            modal._krdsKeydownHandler = null;
        }
        setTimeout(() => {
            modal.classList.add('hidden');
            if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
                lastFocusedEl.focus();
            }
        }, 300);
    }

    return { open, close };
})();

/* -----------------------------
   공통 토스트 컨트롤러
------------------------------ */
const KRDSToast = (() => {
    function show(message, duration = 2200) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        if (message) toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
    return { show };
})();

window.getOrCreateUID = getOrCreateUID;
window.formatPhoneNumber = formatPhoneNumber;
window.bindPhoneAutoFormat = bindPhoneAutoFormat;
window.formatKoreanDateTime = formatKoreanDateTime;
window.announce = announce;
window.KRDSModal = KRDSModal;
window.KRDSToast = KRDSToast;
