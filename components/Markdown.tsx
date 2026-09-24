import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  children: string;
  /** Base URL used to resolve relative image paths inside the README. */
  imageBase?: string;
}

export default function Markdown({ children, imageBase }: MarkdownProps) {
  const components: Components = {
    a: ({ node, ...props }) => (
      <a {...props} target="_blank" rel="noreferrer" />
    ),
    img: ({ node, src, ...props }) => {
      let finalSrc = typeof src === "string" ? src : undefined;
      if (finalSrc && imageBase && !/^https?:\/\//.test(finalSrc)) {
        finalSrc = `${imageBase}/${finalSrc.replace(/^\.\//, "")}`;
      }
      // eslint-disable-next-line @next/next/no-img-element
      return <img {...props} src={finalSrc} alt={props.alt ?? ""} loading="lazy" />;
    },
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
