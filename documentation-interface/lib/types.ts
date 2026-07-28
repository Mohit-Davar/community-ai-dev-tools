// Product types
export interface Product {
  category: "Core" | "Analytics" | "Mobile" | "Enterprise";
  color: string;
  description: string;
  icon: string;
  id: string;
  name: string;
  shortName: string;
}

// Documentation types
export interface CodeExample {
  code: string;
  language: string;
}

export interface DocumentationSection {
  codeExamples?: CodeExample[];
  content: string;
  id: string;
  subsections?: DocumentationSection[];
  title: string;
}

export interface Documentation {
  audience: "Users" | "Implementers" | "Contributors";
  content: string;
  description: string;
  id: string;
  lastUpdated: Date;
  productId: string;
  relatedDocs?: string[];
  sections: DocumentationSection[];
  slug: string;
  source: "Official" | "Community" | "Tutorial" | "API Reference";
  tags: string[];
  title: string;
  version: string;
}

// Release notes types
export interface ReleaseNote {
  changes: {
    description: string;
    title: string;
    type: "feature" | "bugfix" | "improvement" | "breaking";
  }[];
  description: string;
  downloadUrl?: string;
  id: string;
  productId: string;
  releaseDate: Date;
  title: string;
  version: string;
}

// Search types
export interface SearchResult {
  id: string;
  product: string;
  relevance: number;
  snippet: string;
  title: string;
  type: "doc" | "product" | "release" | "section";
  url: string;
}

// User preferences
export interface UserPreferences {
  favoriteProductIds: string[];
  language: string;
  recentDocIds: string[];
  theme: "light" | "dark" | "auto";
}

// Analytics types
export interface AnalyticsMetric {
  change: number;
  name: string;
  unit?: string;
  value: number;
}

export interface PageView {
  docId: string;
  duration: number;
  timestamp: Date;
}
