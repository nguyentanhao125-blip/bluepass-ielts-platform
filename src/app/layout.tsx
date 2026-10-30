import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "BluePass IELTS — Hệ Thống Khảo Thí, Luyện Đề Học Thuật & Thi Xếp Lớp Chuẩn Quốc Tế",
  description:
    "Nền tảng Luyện đề IELTS Academic Reading, Listening chấm điểm tự động 100%, Thi Xếp Lớp chống gian lận, Sổ Từ Vựng Học Thuật và Cổng Thông Báo Xếp Lớp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-800">
        <AppProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <AuthModal />
          <ChatWidget />
        </AppProvider>
      </body>
    </html>
  );
}
