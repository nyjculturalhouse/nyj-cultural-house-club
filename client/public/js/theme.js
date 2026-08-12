/**
 * theme.js
 * 모든 페이지가 공유하는 Tailwind 색상 테마입니다.
 * ⚠️ 색상 값은 기존 시스템 그대로 유지합니다. 값을 바꾸면 전 페이지 색상이 함께 바뀝니다.
 *   primary : #111111 (hover #222222) — 매거진 스타일의 깊은 다크 차콜
 *   accent  : #FF5A36 (hover #E04825) — 힙한 오렌지 레드 포인트
 *   bg      : #F4F4F3               — 미색이 도는 부드러운 화이트 배경
 *   surface : #ffffff
 *   outline : #EAEAEA
 */
window.KRDS_TAILWIND_THEME = {
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#000000",
                    hover: "#000000"
                },
                accent: {
                    bg: "#000000",
                    text: "#FFFFFF",
                    hover: "#000000"
                },
                bg: "#FFFFFF",
                surface: "#FFFFFF",
                outline: "#000000"
            },
            boxShadow: {
                soft: "0 8px 30px rgba(0,0,0,0.03)",
                modal: "0 20px 50px rgba(0, 0, 0, 0.15)"
            }
        }
    }
};

if (window.tailwind) {
    window.tailwind.config = window.KRDS_TAILWIND_THEME;
}
