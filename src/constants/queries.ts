// src/constants/queries.ts
export const CATEGORY_KEYWORDS = {
  welfare: '주민센터',
  admin  : '행정복지센터',
  police : '파출소',
  // ...
} as const;
export type Category = keyof typeof CATEGORY_KEYWORDS;