import type { Reviews } from "@src/features/pr/llm-call";

// Remove duplicate findings that may appear when multiple chunks reference related code.
export function deduplicateReviews(reviews: Reviews): Reviews {
  const seen = new Set<string>();

  return reviews.filter((review) => {
    const key = `${review.file}:${review.line}:${review.problem}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
