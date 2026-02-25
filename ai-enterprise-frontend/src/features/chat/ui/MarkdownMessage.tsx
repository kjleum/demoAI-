// path: src/features/chat/ui/MarkdownMessage.tsx
import React, { useMemo } from "react";
import { renderMarkdownSafe } from "@/shared/lib/markdown/markdown";

export function MarkdownMessage({ content }: { content: string }): React.ReactElement {
  const html = useMemo(() => renderMarkdownSafe(content), [content]);
  // sanitized HTML
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
