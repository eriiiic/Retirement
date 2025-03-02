declare module 'react-markdown' {
  import React from 'react'
  
  interface ReactMarkdownProps {
    children: string
    className?: string
    [key: string]: any
  }
  
  const ReactMarkdown: React.FC<ReactMarkdownProps>
  
  export default ReactMarkdown
} 