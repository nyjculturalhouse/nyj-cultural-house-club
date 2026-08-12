const url = "https://script.google.com/macros/s/AKfycbw8TIvA_grDjk0Lu98nSh3gplAUBHezY5rp5ANDlxu4Fk7b2x6VRd0Lbw6wgFNA-NvL9A/exec?mode=getAttendanceStatus";

try {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; NYJCulturalHousePreview/1.0)",
    },
    redirect: "follow",
  });
  const body = await response.text();
  console.log(JSON.stringify({ status: response.status, ok: response.ok, contentType: response.headers.get("content-type"), sample: body.slice(0, 260) }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
