import yaml from "js-yaml";

export function parseOrderYaml(content: string): string[] {
  try {
    const parsed = yaml.load(content);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    console.warn("[ReadMe Parser] Failed to parse _order.yaml:", error);
    return [];
  }
}
