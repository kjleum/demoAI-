// path: src/shared/lib/markdown/markdown.ts
import MarkdownIt from "markdown-it";
import DOMPurify from "dompurify";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
});

export function renderMarkdownSafe(markdown: string): string {
  const raw = md.render(markdown);
  // sanitize anyway (defense-in-depth)
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}
