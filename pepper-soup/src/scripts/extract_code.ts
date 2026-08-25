import path from "path";
import fs from "fs/promises";
import Parser from "tree-sitter";
import Java from "tree-sitter-java";
import TypeScript from "tree-sitter-typescript";

// Returns the first meaningful line from a code block.
function firstMeaningfulLine(bodyText: string): string | null {
  const lines = bodyText.split("\n");
  for (const line of lines.slice(1)) {
    const text = line.trim();
    if (text && text !== "{" && text !== "}" && text !== "*/") {
      return text;
    }
  }
  return null;
}

// Keeps the first line of a function body and removes the rest.
function smartStrip(bodyText: string): string {
  const firstLine = firstMeaningfulLine(bodyText);
  return firstLine ? `{\n  ${firstLine} /* … */\n}` : `{ /* … */ }`;
}

// Parses the file and reduces function bodies to save tokens.
export async function summarizeCodeFile(filePath: string): Promise<string> {
  let code = await fs.readFile(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();
  const parser = new Parser();
  // Select the parser based on the file extension.
  if (ext === ".java") {
    parser.setLanguage(Java);
  } else if (ext === ".ts" || ext === ".js") {
    parser.setLanguage(TypeScript.typescript);
  } else if (ext === ".tsx" || ext === ".jsx") {
    parser.setLanguage(TypeScript.tsx);
  } else {
    return code;
  }

  // Build the AST for the source file.
  const tree = parser.parse(code);
  const blocks: {
    start: number;
    end: number;
    bodyText: string;
  }[] = [];

  // Find method and function bodies in the AST.
  function visit(node: Parser.SyntaxNode) {
    const parent = node.parent?.type;
    const isJavaMethod =
      ext === ".java" &&
      node.type === "block" &&
      (parent === "method_declaration" || parent === "constructor_declaration");
    const isJsMethod =
      ext !== ".java" &&
      node.type === "statement_block" &&
      (parent === "function_declaration" ||
        parent === "method_definition" ||
        parent === "arrow_function");
    if (isJavaMethod || isJsMethod) {
      blocks.push({
        start: node.startIndex,
        end: node.endIndex,
        bodyText: code.slice(node.startIndex, node.endIndex),
      });
    }
    // Recursively visit child nodes.
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        visit(child);
      }
    }
  }
  visit(tree.rootNode);

  // Replace blocks from the end to keep indexes valid.
  blocks.sort((a, b) => b.start - a.start);
  for (const block of blocks) {
    code =
      code.slice(0, block.start) +
      smartStrip(block.bodyText) +
      code.slice(block.end);
  }
  return code;
}
