export const POST_CATEGORIES = ["Finance", "Legal", "Economics", "Coding", "Other"] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export function isPostCategory(value: string): value is PostCategory {
  return (POST_CATEGORIES as readonly string[]).includes(value);
}
