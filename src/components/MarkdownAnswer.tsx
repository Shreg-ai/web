import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders LLM-generated answers/reasoning (which are usually markdown) as actual formatted text instead of raw #/** syntax. */
export function MarkdownAnswer({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm prose-neutral max-w-none prose-headings:font-medium prose-headings:text-neutral-900 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0 prose-a:text-violet-600 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
