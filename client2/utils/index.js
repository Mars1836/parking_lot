export function convertToDateTimeFormat(dateStr) {
  try {
    const date = new Date(dateStr);

    // Định dạng lại thành ngày tháng năm giờ phút giây
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0, cộng thêm 1
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    // Kết hợp các phần lại thành chuỗi
    const formattedDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;

    return formattedDate;
  } catch (error) {
    console.error(error);
    return dateStr;
  }
}

export function convertToDurationFormat(duration) {
  duration = duration / 1000;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}
