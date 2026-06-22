import React from 'react';

// ── JSX rendering helpers for question and hint text ──────────────────────
// Converts **bold** markdown to <strong> elements.

interface Hint {
    preview: string;
    fullText: string;
}

// Parse a question template string into rendered JSX + extracted hint objects.
export const renderQuestionText = (text: string): { renderedQuestion: React.ReactNode[]; hints: Hint[] } => {
    const lines = text.split('\n');
    const questionLines: string[] = [];
    const hints: Hint[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('Hint:')) {
            const m = line.match(/Hint:\s*\{([^}]+)\}/);
            if (m) {
                const ci = m[1].indexOf(',');
                hints.push(ci === -1
                    ? { preview: m[1], fullText: m[1] }
                    : { preview: m[1].substring(0, ci).trim(), fullText: m[1].substring(ci + 1).trim() });
            }
        } else {
            questionLines.push(line);
        }
    }

    const renderedQuestion = questionLines.join(' ').split(/(\*\*.*?\*\*)/g).map((part, idx) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={idx}>{part.slice(2, -2)}</strong>
            : <span key={idx}>{part}</span>
    );

    return { renderedQuestion, hints };
};

// Render hint text, converting **bold** markdown to <strong> elements.
export const renderHintText = (hintText: string): React.ReactNode[] =>
    hintText.split(/(\*\*.*?\*\*)/g).map((part, idx) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={idx}>{part.slice(2, -2)}</strong>
            : <span key={idx}>{part}</span>
    );
