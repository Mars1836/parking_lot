/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Xuất trang tĩnh
  images: {
    unoptimized: true, // Tắt tính năng tối ưu hóa hình ảnh
    domains: ["localhost"], // Chỉ định các domain hình ảnh được phép
  },
};

export default nextConfig;
