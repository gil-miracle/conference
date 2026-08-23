import Link from "next/link";

/** 메인 요약 섹션 하단의 '전체 보기' 링크 */
export default function MoreLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="more-link reveal" href={href}>
      {children}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
