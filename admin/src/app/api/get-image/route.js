import { NextResponse } from "next/server";
import { endpoint } from "../index";

export async function GET(request) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const imageSrc = searchParams.get("imageSrc"); // Lấy tham số imageSrc từ query
  const serverUrl = searchParams.get("serverUrl");

  // Xây dựng URL của ảnh
  const imageUrl = `${endpoint.staticFile(serverUrl, imageSrc)}`;
  console.log(imageUrl);

  // Gửi yêu cầu với header ngrok-skip-browser-warning
  const response = await fetch(imageUrl, {
    method: "GET",
    headers: {
      "ngrok-skip-browser-warning": "true", // Bỏ qua trang cảnh báo của ngrok
    },
  });
  const contentType = response.headers.get("content-type");

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": response.headers.get("content-length"),
    },
  });
}
