import "@/styles/site.css";

import SessionProvider from "@/components/SessionProvider";
import Banner from "@/components/Banner";
import Nav from "@/components/nav/Nav";
import BottomTabs from "@/components/nav/BottomTabs";
import SiteFooter from "@/components/sections/SiteFooter";
import LoginSheet from "@/components/LoginSheet";

/**
 * 레이아웃은 서버에서 세션을 조회하지 않는다.
 * 조회하면 하위 페이지가 전부 동적이 되어 Link prefetch가 막히고
 * 메뉴 이동마다 서버 왕복이 생긴다. 세션·배너는 SessionProvider가
 * 클라이언트에서 받아오고, 페이지는 정적으로 남겨 즉시 전환되게 한다.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Banner />
      <Nav />
      <main className="site-main">{children}</main>
      <SiteFooter />
      <BottomTabs />
      <LoginSheet />
    </SessionProvider>
  );
}
