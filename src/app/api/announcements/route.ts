import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getStore, saveStoreToDisk } from "@/lib/store";
import { AnnouncementCategory, AnnouncementItem, PlacementRow } from "@/lib/types";

export async function GET() {
  const store = getStore();
  const sorted = [...store.announcements]
    .filter((a) => a.isPublished)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  return NextResponse.json({
    announcements: sorted,
    unreadCount: sorted.filter((a) => a.isNew).length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const caller = getAuthenticatedUser(req);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "STAFF")) {
      return NextResponse.json(
        {
          error:
            "Truy cập bị từ chối (403 Forbidden): Học sinh không có quyền đăng thông báo chính thức!",
        },
        { status: 403 }
      );
    }

    const store = getStore();
    const body = await req.json();
    const {
      title,
      category,
      senderName,
      senderDepartment,
      contentHtml,
      attachmentName,
      attachmentUrl,
      placementData,
      isPinned,
    }: {
      title: string;
      category?: AnnouncementCategory;
      senderName?: string;
      senderDepartment?: string;
      contentHtml: string;
      attachmentName?: string;
      attachmentUrl?: string;
      placementData?: PlacementRow[];
      isPinned?: boolean;
    } = body;

    if (!title || !contentHtml) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Tiêu đề và Nội dung thông báo." },
        { status: 400 }
      );
    }

    const newAnnouncement: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      slug: `thong-bao-${Date.now()}`,
      category: category || "PLACEMENT_RESULT",
      senderName: senderName || "Phòng Đào Tạo & Khảo Thí",
      senderDepartment: senderDepartment || "Ban Quản Trị BluePass",
      contentHtml,
      attachmentName: attachmentName || undefined,
      attachmentUrl: attachmentUrl || undefined,
      placementData: Array.isArray(placementData) && placementData.length > 0 ? placementData : undefined,
      isPinned: Boolean(isPinned),
      isPublished: true,
      isNew: true,
      publishedAt: new Date().toISOString(),
    };

    store.announcements.unshift(newAnnouncement);
    saveStoreToDisk(store);

    return NextResponse.json({
      success: true,
      announcement: newAnnouncement,
    });
  } catch {
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đăng thông báo mới." },
      { status: 500 }
    );
  }
}
