// Detects whether a worksheet name / content suggests it's a worked scenario.
// Heuristic: name contains "scenario", "example", "case", "test", "worked".
export function isScenarioSheet(sheetName: string): boolean {
  const lower = sheetName.toLowerCase();
  return (
    lower.includes("scenario") ||
    lower.includes("example") ||
    lower.includes("case") ||
    lower.includes("test") ||
    lower.includes("worked") ||
    lower.includes("sample")
  );
}
