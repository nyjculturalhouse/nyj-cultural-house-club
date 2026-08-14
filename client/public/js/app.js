/**
 * app.js
 * attendance.html 전용 3단계(요일 → 동아리 → 인원) 출석 앱.
 * getOrCreateUID 등 공통 헬퍼는 utils.js 로 이동했습니다.
 */
const AttendanceApp = (() => {

    let state = {
        day: '',
        week: '',
        preferredClub: '',
        club: '',
        attendanceCount: null,
        previousPendingWeek: null
    };

    const STEP_ORDER = ["step-days", "step-clubs", "step-members"];

    /* =========================
        모달
    ========================= */
    function successIconMarkup() {
        return `
            <svg class="attendance-completion-mark" viewBox="0 0 72 72" focusable="false" aria-hidden="true">
                <circle class="attendance-completion-mark__ring" cx="36" cy="36" r="29"></circle>
                <path class="attendance-completion-mark__tick" d="M22 37.5 31.5 47 51 26"></path>
            </svg>
        `;
    }

    function showModal(isAlreadySubmitted) {
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const icon = document.getElementById('modal-icon');
        const panel = document.getElementById('result-modal-panel');
        const status = document.getElementById('attendance-completion-status');
        const confirmButton = document.getElementById('result-modal-confirm');
        if (!modal || !title || !desc || !icon || !panel) return;

        modal.classList.toggle('attendance-result--success', !isAlreadySubmitted);
        modal.classList.toggle('attendance-result--notice', isAlreadySubmitted);

        if (isAlreadySubmitted) {
            icon.textContent = '!' ;
            title.textContent = '이미 출석부를 제출하였습니다.';
            desc.textContent = '제출 후에는 온라인 수정이 불가능합니다. 수정이 필요한 경우 사무실에 방문하여 수정을 요청해 주시기 바랍니다.';
            if (status) status.textContent = '이미 제출된 출석부입니다.';
        } else {
            icon.innerHTML = successIconMarkup();
            title.textContent = '출석이 등록되었습니다.';
            const dayLabel = state.day ? `${state.day}요일` : '선택한 날짜';
            desc.textContent = `${state.club}의 ${dayLabel} 출석 ${state.attendanceCount}명이 성공적으로 반영되었습니다.`;
            if (status) status.textContent = `${state.club} 출석 ${state.attendanceCount}명이 등록되었습니다.`;
        }

        if (window.KRDSModal) {
            window.KRDSModal.open('result-modal');
        } else {
            modal.classList.remove('hidden');
        }

        window.setTimeout(() => {
            panel.focus({ preventScroll: true });
            confirmButton?.focus({ preventScroll: true });
        }, 0);
    }

    window.closeModal = () => {
        const modal = document.getElementById('result-modal');
        modal?.classList.remove('attendance-result--success', 'attendance-result--notice');
        if (window.KRDSModal) {
            window.KRDSModal.close('result-modal');
        } else {
            modal?.classList.add('hidden');
        }
        document.getElementById('btn-submit-attendance')?.focus({ preventScroll: true });
    };

    /* =========================
        단계 전환 + 스텝 인디케이터 갱신
    ========================= */
    function showStep(step) {
        STEP_ORDER.forEach(id => document.getElementById(id)?.classList.add("hidden"));
        document.getElementById(step)?.classList.remove("hidden");
        updateStepIndicator(STEP_ORDER.indexOf(step) + 1);

        // 보조기기 사용자를 위해 다음 섹션의 제목으로 포커스를 이동합니다.
        const heading = document.querySelector(`#${step} h1, #${step} h2`);
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
        }
    }

    function updateStepIndicator(currentStepNumber) {
        const items = document.querySelectorAll('#attendance-steps li');
        items.forEach((li, idx) => {
            const stepNum = idx + 1;
            li.classList.toggle('done', stepNum < currentStepNumber);
            if (stepNum === currentStepNumber) {
                li.setAttribute('aria-current', 'step');
            } else {
                li.removeAttribute('aria-current');
            }
        });
    }

    function formatDateLabel(value) {
        const date = new Date(`${value}T00:00:00`);
        return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
    }

    function updateWeekContext() {
        const context = document.getElementById('attendance-week-context');
        const label = document.getElementById('attendance-week-label');
        if (context && label && state.week) {
            const formatted = formatDateLabel(state.week);
            label.textContent = `${formatted} 시작 주차 출석체크`;
            context.classList.remove('hidden');
            const description = context.querySelector('p:last-child');
            if (description && state.preferredClub) {
                description.textContent = `${state.preferredClub} 동아리의 출석을 위해 요일을 선택하세요.`;
            }
        } else if (context) {
            context.classList.add('hidden');
        }
    }

    function init() {
        const selectedWeek = new URLSearchParams(window.location.search).get('week');
        const selectedClub = new URLSearchParams(window.location.search).get('club');
        state.week = selectedWeek || '';
        state.preferredClub = selectedClub || '';
        state.attendanceCount = null;
        state.previousPendingWeek = null;
        updateWeekContext();
        showStep("step-days");
        renderDays();
    }

    /* =========================
        1단계 - 요일 선택
    ========================= */
    function renderDays() {
        const days = [
            { key: "화", ko: "화요일" },
            { key: "수", ko: "수요일" },
            { key: "목", ko: "목요일" },
            { key: "금", ko: "금요일" },
            { key: "토", ko: "토요일" },
            { key: "일", ko: "일요일" }
        ];

        const box = document.getElementById("day-buttons");
        if (!box) return;
        box.innerHTML = "";
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', '요일 선택');

        days.forEach(d => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "flex flex-col-reverse items-center justify-center p-4 rounded-xl border bg-white hover:border-black transition active:scale-95";
            btn.setAttribute('aria-pressed', 'false');
            btn.innerHTML = `
                <span class="day-kr text-2xl font-black text-gray-800">${d.ko}</span>
            `;

            btn.addEventListener('click', () => {
                state.day = d.key;
                document.querySelectorAll("#day-buttons button").forEach(b => {
                    b.classList.remove("selected");
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add("selected");
                btn.setAttribute('aria-pressed', 'true');
                loadClubs(d.key);
            });
            box.appendChild(btn);
        });
    }

    /* =========================
        2단계 - 동아리 선택
    ========================= */
    async function loadClubs(day) {
        state.club = '';
        state.attendanceCount = null;
        state.previousPendingWeek = null;
        showStep("step-clubs");

        const box = document.getElementById("club-buttons");
        if (!box) return;
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', '동아리 선택');
        box.innerHTML = '<p class="text-gray-500 p-4" role="status">불러오는 중...</p>';

        const getFn = window.apiGet;
        if (typeof getFn !== "function") {
            box.innerHTML = "<p class='text-red-500 p-4' role='alert'>API 로드 오류: 페이지를 새로고침 해주세요.</p>";
            return;
        }

        const clubs = await getFn("getClubs", { day });
        box.innerHTML = "";

        const preferredClubExists = Boolean(state.preferredClub && clubs?.includes(state.preferredClub));
        if (state.preferredClub && !preferredClubExists) {
            box.insertAdjacentHTML('beforeend', `<p class="col-span-full border border-black p-3 text-sm font-bold" role="status">${state.preferredClub} 동아리는 선택한 요일에 등록되어 있지 않습니다. 다른 요일을 선택해 주세요.</p>`);
        }

        if (!clubs || clubs.length === 0) {
            box.innerHTML = "<p class='text-gray-500 p-4' role='status'>등록된 동아리가 없습니다.</p>";
            return;
        }

        clubs.forEach(c => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p-4 rounded-xl border bg-white hover:border-black transition text-left";
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = c;
            if (c === state.preferredClub) {
                btn.classList.add('border-black');
                btn.setAttribute('aria-label', `${c} 동아리, 선택한 동아리`);
            }
            btn.addEventListener('click', () => {
                state.club = c;
                document.querySelectorAll("#club-buttons button").forEach(x => {
                    x.classList.remove("selected");
                    x.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add("selected");
                btn.setAttribute('aria-pressed', 'true');
                loadAttendanceCount(c);
            });
            box.appendChild(btn);
        });
    }

    /* =========================
        3단계 - 인원 입력 및 직전 미출석 안내
    ========================= */
    function getMonthWeekIndex(date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return Math.min(5, Math.ceil((date.getDate() + firstDay) / 7));
    }

    function previousMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    }

    async function findPreviousPendingWeek(club) {
        const getFn = window.apiGet;
        if (typeof getFn !== "function") return null;

        const targetDate = state.week ? new Date(`${state.week}T00:00:00`) : new Date();
        const targetIndex = getMonthWeekIndex(targetDate);
        const currentMonthData = await getFn("getMonthlyAttendanceStatus", {
            year: targetDate.getFullYear(),
            month: targetDate.getMonth() + 1
        });
        const currentClub = Array.isArray(currentMonthData) ? currentMonthData.find(item => item?.club === club) : null;
        const earlierWeeks = currentClub?.weeks?.filter(week => Number(week.index) < targetIndex && !week.completed) || [];
        if (earlierWeeks.length) return earlierWeeks.sort((a, b) => Number(b.index) - Number(a.index))[0];

        if (targetIndex !== 1) return null;
        const priorDate = previousMonth(targetDate);
        const previousMonthData = await getFn("getMonthlyAttendanceStatus", {
            year: priorDate.getFullYear(),
            month: priorDate.getMonth() + 1
        });
        const previousClub = Array.isArray(previousMonthData) ? previousMonthData.find(item => item?.club === club) : null;
        const previousWeeks = previousClub?.weeks?.filter(week => !week.completed) || [];
        return previousWeeks.length ? previousWeeks.sort((a, b) => Number(b.index) - Number(a.index))[0] : null;
    }

    function hidePreviousWeekNotice() {
        document.getElementById('previous-week-notice')?.classList.add('hidden');
    }

    function showPreviousWeekNotice(week) {
        const notice = document.getElementById('previous-week-notice');
        const text = document.getElementById('previous-week-notice-text');
        if (!notice || !text) return;
        text.textContent = `${formatDateLabel(week.start)} 시작 주차의 출석이 아직 등록되지 않았습니다.`;
        notice.classList.remove('hidden');
    }

    async function loadAttendanceCount(club) {
        state.attendanceCount = null;
        state.previousPendingWeek = null;
        showStep("step-members");

        const title = document.getElementById("club-title");
        if (title) title.textContent = club;

        const input = document.getElementById('attendance-count');
        if (input) {
            input.value = '';
            input.focus({ preventScroll: true });
        }
        hidePreviousWeekNotice();
        const previousWeek = await findPreviousPendingWeek(club);
        if (previousWeek) {
            state.previousPendingWeek = previousWeek;
            showPreviousWeekNotice(previousWeek);
        }
    }

    /* =========================
        제출
    ========================= */
    async function submit() {
        if (!state.club) {
            window.announce ? window.announce("동아리를 선택하세요.") : alert("동아리를 선택하세요.");
            return;
        }
        const countInput = document.getElementById('attendance-count');
        const count = Number(countInput?.value);
        if (!Number.isInteger(count) || count < 1) {
            window.announce ? window.announce("출석 인원을 한 명 이상 숫자로 입력하세요.") : alert("출석 인원을 한 명 이상 숫자로 입력하세요.");
            countInput?.focus();
            return;
        }
        state.attendanceCount = count;

        const today = new Date().toISOString().split('T')[0];
        const attendanceKey = state.week || today;
        const hasSubmitted = localStorage.getItem(`attendance_${attendanceKey}`);

        if (hasSubmitted) {
            showModal(true);
            return;
        }

        const postFn = window.apiPost;
        if (typeof postFn !== "function") {
            alert("API 데이터 전송 함수가 준비되지 않았습니다. 새로고침 후 다시 시도해 주세요.");
            return;
        }

        const submitBtn = document.getElementById('btn-submit-attendance');
        const submitLabel = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
            submitBtn.textContent = '출석 저장 중…';
        }

        const res = await postFn({
            mode: "submitAttendance",
            clubName: state.club,
            attendanceCount: count,
            day: state.day,
            attendanceWeek: state.week,
            uid: window.getOrCreateUID ? window.getOrCreateUID() : ''
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            submitBtn.textContent = submitLabel || '출석 제출하기';
        }

        if (!res || res.error) {
            alert(res?.error || "응답이 없습니다.");
            return;
        }

        localStorage.setItem(`attendance_${attendanceKey}`, 'true');
        showModal(false);

        state.attendanceCount = null;
        state.club = '';
        state.day = '';
        init();
    }

    function usePreviousWeek() {
        if (!state.previousPendingWeek?.start) return;
        state.week = state.previousPendingWeek.start;
        state.previousPendingWeek = null;
        updateWeekContext();
        hidePreviousWeekNotice();
        const input = document.getElementById('attendance-count');
        input?.focus({ preventScroll: true });
        window.announce?.("직전 미출석 주차로 변경했습니다.");
    }

    function keepSelectedWeek() {
        state.previousPendingWeek = null;
        hidePreviousWeekNotice();
        document.getElementById('attendance-count')?.focus({ preventScroll: true });
    }

    return { init, submit, usePreviousWeek, keepSelectedWeek };
})();

window.AttendanceApp = AttendanceApp;
window.submitAttendance = AttendanceApp.submit;
document.getElementById('btn-use-previous-week')?.addEventListener('click', AttendanceApp.usePreviousWeek);
document.getElementById('btn-keep-selected-week')?.addEventListener('click', AttendanceApp.keepSelectedWeek);
