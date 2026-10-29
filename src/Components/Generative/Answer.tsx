import styled from "styled-components";
import { marked } from "marked";

// Configure marked to use GitHub Flavored Markdown
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function Answer({ text }: { text: string }) {
  const html = marked.parse(text) as string;
  return <AnswerContent dangerouslySetInnerHTML={{ __html: html }} />;
}

const AnswerContent = styled.div`
  color: #666;
  overflow: hidden;

  h1 {
    font-size: 24px;
    font-weight: 700;
    margin-top: 24px;
    margin-bottom: 8px;
    letter-spacing: -0.025em;
    color: #333;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    margin-top: 20px;
    margin-bottom: 8px;
    letter-spacing: -0.025em;
    color: #333;
  }

  h3 {
    font-size: 16px;
    font-weight: 700;
    margin-top: 16px;
    margin-bottom: 8px;
    letter-spacing: -0.025em;
    color: #333;
  }

  h4,
  h5,
  h6 {
    font-size: 14px;
    font-weight: 600;
    margin-top: 12px;
    margin-bottom: 8px;
    letter-spacing: -0.025em;
    color: #333;
  }

  p {
    font-size: 14px;
    margin: 16px 0;
  }

  strong {
    font-weight: 600;
    color: #333;
  }

  em {
    font-style: italic;
    color: #666;
  }

  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
    font-family: monospace;
    word-break: break-all;
  }

  pre {
    background: #2b2b2b;
    color: #e5e5e5;
    padding: 16px;
    border-radius: 8px;
    margin: 16px 0;
    overflow-x: auto;
    font-size: 14px;
    line-height: 1.6;

    code {
      background: transparent;
      padding: 0;
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  blockquote {
    border-left: 4px solid #d63b26;
    padding-left: 16px;
    margin: 16px 0;
    color: #666;
    font-style: italic;

    p {
      margin: 0;
    }
  }

  ul,
  ol {
    margin: 16px 0;
    padding-left: 24px;

    li {
      font-size: 14px;
      margin-bottom: 8px;
    }
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  thead {
    background: #f9f9f9;
  }

  th {
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  td {
    padding: 12px 16px;
    font-size: 14px;
    color: #666;
    border-top: 1px solid #e5e5e5;
  }

  tbody tr:hover {
    background: #f9f9f9;
  }
`;
