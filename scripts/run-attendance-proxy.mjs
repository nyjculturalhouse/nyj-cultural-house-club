import { fetchAttendanceStatuses } from "../server/attendanceStatus.ts";

try {
  const statuses = await fetchAttendanceStatuses();
  console.log(JSON.stringify({ count: statuses.length, first: statuses[0] }));
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
}
