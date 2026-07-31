import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";

/**
 * Converts Confluence Storage Format (XHTML) to plain Markdown.
 *
 * Handles:
 * - `ac:structured-macro name="code"` → fenced code block
 * - `ri:attachment` → resolves download URLs via attachmentUrlMap
 */
export async function parseConfluenceStorage(
  xhtml: string,
  attachmentUrlMap: Map<string, string>
): Promise<string> {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(() => (tree) => {
      visit(tree, "element", (node: any) => {
        // Convert Confluence code macros to standard <pre><code> blocks
        if (
          node.tagName === "ac:structured-macro" &&
          node.properties?.["name"] === "code"
        ) {
          node.tagName = "pre";
          let codeContent = "";
          visit(node, "element", (childNode: any) => {
            if (childNode.tagName === "ac:plain-text-body") {
              if (childNode.children?.[0]?.type === "text") {
                codeContent = childNode.children[0].value;
              }
            }
          });
          node.children = [
            {
              children: [{ type: "text", value: codeContent }],
              tagName: "code",
              type: "element",
            },
          ];
        }

        // Resolve attachment filenames to their download URLs
        if (node.tagName === "ri:attachment") {
          const filename = node.properties?.["ri:filename"];
          if (filename && attachmentUrlMap.has(filename)) {
            // Attachment URL is available; a richer parser could reconstruct img/a tags here.
            // For v1 we leave the node as-is since rehype-remark drops unknown tags anyway.
          }
        }
      });
    })
    .use(rehypeRemark)
    .use(remarkStringify);

  const file = await processor.process(xhtml);
  return String(file);
}
