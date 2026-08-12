import axios from "axios";
import https from "node:https";

const url = "https://script.google.com/macros/s/AKfycbw8TIvA_grDjk0Lu98nSh3gplAUBHezY5rp5ANDlxu4Fk7b2x6VRd0Lbw6wgFNA-NvL9A/exec?mode=getAttendanceStatus";
const httpsAgent = new https.Agent({ family: 4, keepAlive: false });

try {
  const response = await axios.get(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; NYJCulturalHousePreview/1.0)" },
    httpsAgent,
    maxRedirects: 5,
    timeout: 30_000,
    validateStatus: () => true,
  });
  console.log(JSON.stringify({ status: response.status, isArray: Array.isArray(response.data), sample: JSON.stringify(response.data).slice(0, 240) }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
