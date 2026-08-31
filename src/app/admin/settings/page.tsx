import { requireAdmin } from "@/lib/admin";
import { parseSiteSettings, DEFAULT_MENUS, type SiteSettings } from "@/lib/settings";
import BannerSettingCard from "./BannerSettingCard";
import ToggleSettingCard from "./ToggleSettingCard";
import SheetSync from "./SheetSync";
import MenuVisibilityCard from "./MenuVisibilityCard";

export const dynamic = "force-dynamic";

const DEMO_SETTINGS: SiteSettings = {
  banner: { text: "", visible: false },
  galleryOpen: false,
  guestbookOpen: true,
  roomsOpen: false,
  teamsOpen: false,
  scoresOpen: false,
  menus: DEFAULT_MENUS,
};

export default async function AdminSettingsPage() {
  const ctx = await requireAdmin();

  let settings = DEMO_SETTINGS;
  if (!ctx.demo) {
    const { data } = await ctx.supabase.from("site_settings").select("key,value");
    settings = parseSiteSettings(data);
  }

  return (
    <>
      <BannerSettingCard banner={settings.banner} />
      {/* 숙소는 며칠 전에 확정되는데 조는 당일까지 바뀐다 — 따로 연다 */}
      <ToggleSettingCard
        settingKey="rooms_open"
        title="숙소 공개"
        description="숙소 배정이 끝나면 켜세요. 끄면 참가자 My에서 숙소가 미정으로 보입니다"
        initialOn={settings.roomsOpen}
      />
      <ToggleSettingCard
        settingKey="teams_open"
        title="조 공개"
        description="조 편성이 끝나면 켜세요. 끄면 참가자 My에서 조가 미정으로 보입니다"
        initialOn={settings.teamsOpen}
      />
      <ToggleSettingCard
        settingKey="gallery_open"
        title="갤러리 오픈"
        description="참가자 사진 업로드·열람 허용 (컨퍼런스 시작할 때 켜기)"
        initialOn={settings.galleryOpen}
      />
      <ToggleSettingCard
        settingKey="scores_open"
        title="조 점수 공개"
        description="레크리에이션 순위를 참가자에게 보여줍니다 (진행자는 늘 보입니다)"
        initialOn={settings.scoresOpen}
      />
      <ToggleSettingCard
        settingKey="guestbook_open"
        title="방명록 작성"
        description="로그인 참가자 작성 허용"
        initialOn={settings.guestbookOpen}
      />
      <MenuVisibilityCard menus={settings.menus} />
      <SheetSync />
    </>
  );
}
