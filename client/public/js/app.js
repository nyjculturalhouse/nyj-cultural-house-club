/**
 * app.js
 * attendance.html 전용 3단계(요일 → 동아리 → 회원) 출석 앱.
 * getOrCreateUID 등 공통 헬퍼는 utils.js 로 이동했습니다.
 */
const AttendanceApp = (() => {

    let state = {
        day: '',
        club: '',
        members: []
    };

    const STEP_ORDER = ["step-days", "step-clubs", "step-members"];

    /* =========================
        모달
    ========================= */
    function showModal(isAlreadySubmitted) {
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const icon = document.getElementById('modal-icon');
        if (!modal || !title || !desc || !icon) return;

        if (isAlreadySubmitted) {
            icon.textContent = '⚠️';
            title.textContent = '이미 출석부를 제출하였습니다.';
            desc.textContent = '제출 후에는 온라인 수정이 불가능합니다. 수정이 필요한 경우 사무실에 방문하여 수정을 요청해 주시기 바랍니다.';
        } else {
            icon.textContent = '✅';
            title.textContent = '출석이 등록되었습니다.';
            desc.textContent = '오늘의 출석이 성공적으로 반영되었습니다.';
        }

        if (window.KRDSModal) {
            window.KRDSModal.open('result-modal');
        } else {
            modal.classList.remove('hidden');
        }
    }

    window.closeModal = () => {
        if (window.KRDSModal) {
            window.KRDSModal.close('result-modal');
        } else {
            document.getElementById('result-modal')?.classList.add('hidden');
        }
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

    function init() {
        showStep("step-days");
        renderDays();
    }

    /* =========================
        1단계 - 요일 선택
    ========================= */
    function renderDays() {
        const days = [
            { key: "화", en: "TUE", ko: "화요일" },
            { key: "수", en: "WED", ko: "수요일" },
            { key: "목", en: "THU", ko: "목요일" },
            { key: "금", en: "FRI", ko: "금요일" },
            { key: "토", en: "SAT", ko: "토요일" },
            { key: "일", en: "SUN", ko: "일요일" }
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
                <span class="day-en text-xs font-bold text-gray-500" aria-hidden="true">${d.en}</span>
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
        state.members = [];
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
            btn.addEventListener('click', () => {
                state.club = c;
                document.querySelectorAll("#club-buttons button").forEach(x => {
                    x.classList.remove("selected");
                    x.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add("selected");
                btn.setAttribute('aria-pressed', 'true');
                loadMembers(c);
            });
            box.appendChild(btn);
        });
    }

    /* =========================
        3단계 - 회원 선택
    ========================= */
    async function loadMembers(club) {
        state.members = [];
        showStep("step-members");

        const title = document.getElementById("club-title");
        if (title) title.textContent = club;

        const box = document.getElementById("member-list");
        if (!box) return;
        box.setAttribute('role', 'group');
        box.setAttribute('aria-label', `${club} 출석 회원 선택`);
        box.innerHTML = '<p class="text-gray-500 p-4" role="status">불러오는 중...</p>';

        const getFn = window.apiGet;
        if (typeof getFn !== "function") {
            box.innerHTML = "<p class='text-red-500 p-4' role='alert'>API 로드 오류</p>";
            return;
        }

        let members = await getFn("getMembers", { club });
        box.innerHTML = "";

        if (members?.length === 1 && typeof members[0] === "string") {
            members = members[0].split(",").map(v => v.trim()).filter(Boolean);
        }

        if (!members?.length) {
            box.innerHTML = "<p class='text-gray-500 p-4' role='status'>등록된 인원이 없습니다.</p>";
            return;
        }

        members.forEach(m => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "p-3 border rounded-xl bg-white transition hover:border-black";
            btn.setAttribute('aria-pressed', 'false');
            btn.textContent = m;
            btn.addEventListener('click', () => {
                if (state.members.includes(m)) {
                    state.members = state.members.filter(x => x !== m);
                    btn.classList.remove("selected");
                    btn.setAttribute('aria-pressed', 'false');
                } else {
                    state.members.push(m);
                    btn.classList.add("selected");
                    btn.setAttribute('aria-pressed', 'true');
                }
            });
            box.appendChild(btn);
        });
    }

    /* =========================
        제출
    ========================= */
    async function submit() {
        if (!state.club) {
            window.announce ? window.announce("동아리를 선택하세요.") : alert("동아리를 선택하세요.");
            return;
        }
        if (!state.members.length) {
            window.announce ? window.announce("출석 인원을 선택하세요.") : alert("인원을 선택하세요.");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const hasSubmitted = localStorage.getItem(`attendance_${today}`);

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
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
        }

        const res = await postFn({
            mode: "submitAttendance",
            clubName: state.club,
            attendees: state.members,
            day: state.day,
            uid: window.getOrCreateUID ? window.getOrCreateUID() : ''
        });

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
        }

        if (!res || res.error) {
            alert(res?.error || "응답이 없습니다.");
            return;
        }

        localStorage.setItem(`attendance_${today}`, 'true');
        showModal(false);

        state.members = [];
        state.club = '';
        state.day = '';
        init();
    }

    return { init, submit };
})();

window.AttendanceApp = AttendanceApp;
window.submitAttendance = AttendanceApp.submit;
