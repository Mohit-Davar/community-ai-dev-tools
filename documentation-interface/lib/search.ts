import { documentations, products } from "@/lib/mock-data";
import { SearchResult } from "@/lib/types";

export function searchDocumentation(query: string): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search in documentations
  documentations.forEach((doc) => {
    let relevance = 0;
    // Title match (highest relevance)
    if (doc.title.toLowerCase().includes(lowerQuery)) {
      relevance += 100;
    }
    // Description match
    if (doc.description.toLowerCase().includes(lowerQuery)) {
      relevance += 50;
    }
    // Tags match
    if (doc.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
      relevance += 30;
    }
    // Content match
    if (doc.content.toLowerCase().includes(lowerQuery)) {
      relevance += 10;
    }
    if (relevance > 0) {
      const snippet = doc.description.substring(0, 120) + "...";
      results.push({
        id: doc.id,
        product: doc.productId,
        relevance,
        snippet,
        title: doc.title,
        type: "doc",
        url: `/doc/${doc.id}`,
      });
    }
  });
  // Search in products
  products.forEach((product) => {
    let relevance = 0;
    if (product.name.toLowerCase().includes(lowerQuery)) {
      relevance += 100;
    }
    if (product.description.toLowerCase().includes(lowerQuery)) {
      relevance += 50;
    }
    if (relevance > 0) {
      results.push({
        id: product.id,
        product: product.id,
        relevance,
        snippet: product.description,
        title: product.name,
        type: "product",
        url: `/product/${product.id}`,
      });
    }
  });

  // Sort by relevance and return top 20
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
}

export function getRelatedDocumentations(
  currentDocId: string,
  limit: number = 5,
): typeof documentations {
  const current = documentations.find((d) => d.id === currentDocId);
  if (!current) {
    return [];
  }
  return documentations
    .filter(
      (doc) =>
        doc.id !== currentDocId &&
        (doc.productId === current.productId ||
          doc.tags.some((tag) => current.tags.includes(tag))),
    )
    .slice(0, limit);
}
