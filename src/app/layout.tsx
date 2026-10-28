import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import AuthModal from "@/components/AuthModal";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "BluePass IELTS - Hệ Thống Luyện Đề Trắc Nghiệm & Thi Xếp Lớp Chuẩn Quốc Tế",
  description:
    "Nền tảng Luyện đề Reading, Listening chấm điểm tự động 100%, Thi Xếp Lớp chống gian lận, Sổ Từ Vựng, Cổng Thông Báo Xếp Lớp và Tư vấn AI + Nhân viên trực tuyến.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
        <AppProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <AuthModal />
          <ChatWidget />
        </AppProvider>
      </body>
    </html>
  );
}
