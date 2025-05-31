
// src/components/friends/MarkdownRenderer.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    text: string;
    className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, className }) => {
     // Simple Markdown to HTML conversion
     // Note: This is basic and doesn't handle all Markdown features.
     // Consider using a library like 'react-markdown' for more complex needs.
     const renderMarkdown = (markdownText: string) => {
         // Basic replacements - Be very careful about XSS if input isn't trusted
         const boldRegex = /\*\*(.*?)\*\*/g;
         const italicRegex = /\*(.*?)\*/g;
         const listRegex = /^\s*[-*]\s+(.*)/gm;

         let html = markdownText
             .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Basic HTML escaping
             .replace(boldRegex, '<strong>$1</strong>')
             .replace(italicRegex, '<em>$1</em>');

         // Process list items individually and wrap later if needed
         const listItems: string[] = [];
         html = html.replace(listRegex, (match, item) => {
             listItems.push(`<li style="margin-left: 1.5em; list-style-type: disc; margin-bottom: 0.25em;">${item.trim()}</li>`);
             return ''; // Remove the original line from the main text
         });

          // Reconstruct: original text lines + list items wrapped in <ul>
          const paragraphs = html.split('\n').filter(line => line.trim() !== '').map(line => `<p style="margin-bottom: 0.5em;">${line}</p>`).join('');

          const listHtml = listItems.length > 0 ? `<ul style="margin: 0.5em 0;">${listItems.join('')}</ul>` : '';

         return { __html: paragraphs + listHtml };
     };

    return (
        <div
            className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
            dangerouslySetInnerHTML={renderMarkdown(text)}
        />
    );
};

export default MarkdownRenderer;
