import https from "node:https";

const url = "https://script.google.com/macros/s/AKfycbw8TIvA_grDjk0Lu98nSh3gplAUBHezY5rp5ANDlxu4Fk7b2x6VRd0Lbw6wgFNA-NvL9A/exec?mode=getAttendanceStatus";

const response = await new Promise((resolve, reject) => {
  const request = https.get(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; NYJCulturalHousePreview/1.0)",
    },
  }, (res) => {
    let body = "";
    res.setEncoding("utf8");
    res.on("data", (chunk) => { body += chunk; });
    res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, sample: body.slice(0, 240) }));
  });
  request.setTimeout(25_000, () => request.destroy(new Error("timeout")));
  request.on("error", reject);
});

console.log(JSON.stringify(response));
