import HeroDday from "@/components/HeroDday";

export default function HeroSection() {
  return (
    <header className="hero" id="top">
      <img
        className="poster"
        src="/poster.jpg"
        alt="2026 GIL Community Conference MIRACLE 포스터"
      />
      <HeroDday />
    </header>
  );
}
