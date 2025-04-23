export function formatVietnamTime(dateInput: string | number | Date): string {
  const date = new Date(dateInput);

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
