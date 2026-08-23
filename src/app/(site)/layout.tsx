import "@/styles/site.css";

import Banner from "@/components/Banner";
import Nav from "@/components/nav/Nav";
import BottomTabs from "@/components/nav/BottomTabs";
import SiteFooter from "@/components/sections/SiteFooter";
import LoginSheet from "@/components/LoginSheet";
import { getSiteContext } from "@/lib/data/site";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSiteContext();
  const isAdmin = ctx.summary?.role === "admin";

  return (
    <>
      <Banner banner={ctx.banner} />
      <Nav authed={ctx.authed} isAdmin={isAdmin} />
      <main className="site-main">{children}</main>
      <SiteFooter />
      <BottomTabs authed={ctx.authed} />
      <LoginSheet />
    </>
  );
}
