import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * Next.js 권장 규칙 + 이 프로젝트에서 실수하기 쉬운 것들.
 * 디자인 자산(design/)과 빌드 산출물은 검사하지 않는다.
 */
const config = [
  { ignores: [".next/**", "node_modules/**", "design/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 포스터·Cloudinary 이미지는 의도적으로 <img>를 쓴다 (README 렌더링 전략 참고)
      "@next/next/no-img-element": "off",
      // App Router에서는 root layout의 <head>가 폰트를 넣는 정상 위치다 (Pages Router용 규칙)
      "@next/next/no-page-custom-font": "off",
      // 쓰지 않는 변수는 _ 접두사로 명시적으로 표시
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
