/** 하단 탭바 아이콘 — 24x24 스트로크 기반 */
export function TabIcon({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5.5l3.5 2" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.8" />
          <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    case "music":
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v13" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="17.5" cy="16" r="2.5" />
        </svg>
      );
    case "qr":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" />
          <rect x="13.5" y="3.5" width="7" height="7" />
          <rect x="3.5" y="13.5" width="7" height="7" />
          <path d="M13.5 13.5h3v3h-3zM20.5 13.5v3M17.5 20.5h3M13.5 20.5h1" />
        </svg>
      );
    default:
      return null;
  }
}
