import { requireAdmin } from "@/lib/admin";
import { parseSiteSettings, type SiteSettings } from "@/lib/settings";
import BannerSettingCard from "./BannerSettingCard";
import ToggleSettingCard from "./ToggleSettingCard";
import CsvUpload from "./CsvUpload";

export const dynamic = "force-dynamic";

const DEMO_SETTINGS: SiteSettings = {
  banner: { text: "", visible: false },
  galleryOpen: false,
  guestbookOpen: true,
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
      <BannerSettingCard banner={settings.banner} demo={ctx.demo} />
      <ToggleSettingCard
        settingKey="gallery_open"
        title="갤러리 오픈"
        description="참가자 사진 업로드·열람 허용 (행사 후 켜기)"
        initialOn={settings.galleryOpen}
        demo={ctx.demo}
      />
      <ToggleSettingCard
        settingKey="guestbook_open"
        title="방명록 작성"
        description="로그인 참가자 작성 허용"
        initialOn={settings.guestbookOpen}
        demo={ctx.demo}
      />
      <CsvUpload demo={ctx.demo} />
    </>
  );
}
