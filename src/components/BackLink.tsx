import Link from "next/link";
import { ChevronIcon } from "@/components/icons";

/** 상세 → 목록 되돌아가기 링크 */
export default function BackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="back-link" href={href}>
      <ChevronIcon dir="left" />
      {children}
    </Link>
  );
}
