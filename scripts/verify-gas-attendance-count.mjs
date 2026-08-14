const endpoint = process.env.GAS_WEB_APP_URL;

if (!endpoint) {
  throw new Error("GAS_WEB_APP_URL 환경 변수가 필요합니다.");
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  redirect: "follow",
  body: JSON.stringify({
    mode: "submitAttendance",
    clubName: "글♥낭",
    attendanceCount: 0,
    day: "화",
    attendanceWeek: "2026-08-02",
  }),
});

const body = await response.text();
try {
  const payload = JSON.parse(body);
  console.log(JSON.stringify({ status: response.status, payload }, null, 2));
} catch {
  console.log(JSON.stringify({ status: response.status, nonJson: body.slice(0, 160) }, null, 2));
}
