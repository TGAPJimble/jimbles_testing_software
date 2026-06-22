import React, { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { s } from './styles';
import { renderQuestionText, renderHintText } from './renderUtils';
import { stripMarkdownAndHints } from './parseUtils';

interface Question {
    topicName: string;
    originalIndex: number;
    text: string;
}

interface TestPageProps {
    questions: Question[];
    onSubmit: () => void;
    onCancel: () => void;
}

const TestPage: React.FC<TestPageProps> = ({ questions, onSubmit, onCancel }) => {
    const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

    const handleAnswerChange = (i: number, v: string) => {
        const a = [...answers]; a[i] = v; setAnswers(a);
    };

    const toggleHint = (qi: number, hi: number) => {
        const k = `${qi}-${hi}`;
        setRevealedHints(p => ({ ...p, [k]: !p[k] }));
    };

    const handleSubmit = () => {
        // Group answers back by topic, sorted by original question order
        const grouped: Record<string, any[]> = {};
        questions.forEach((q, i) => {
            if (!grouped[q.topicName]) grouped[q.topicName] = [];
            grouped[q.topicName].push({ originalIndex: q.originalIndex, text: q.text, answer: answers[i] });
        });
        for (const t in grouped) grouped[t].sort((a, b) => a.originalIndex - b.originalIndex);

        // Build markdown output and trigger download
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        let md = '';
        for (const t in grouped) {
            md += `${t}:\n`;
            grouped[t].forEach((q, i) => { md += `${i + 1}. "${stripMarkdownAndHints(q.text)}"\n${q.answer}\n`; });
            md += '\n';
        }
        const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url; a.download = `test-${ts}.md`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setShowConfirmation(true);
        setTimeout(() => { setShowConfirmation(false); onSubmit(); }, 2000);
    };

    return (
        <div style={s.pageWrap}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
                <div style={{ ...s.card, padding: '2rem 2.5rem', marginBottom: '1.25rem' }}>
                    <h1 style={s.heading}>
                        Test <span style={{ color: 'var(--accent)' }}>·</span> {questions.length} questions
                    </h1>
                    {showConfirmation && (
                        <div style={{ marginTop: '1rem', background: 'var(--confirm-bg)', border: '1px solid var(--confirm-border)', color: 'var(--confirm-text)', borderRadius: '0.75rem', padding: '0.65rem 1rem', fontSize: '0.88rem', fontWeight: 500 }}>
                            ✓ Answers downloaded!
                        </div>
                    )}
                </div>

                {questions.map((question, idx) => {
                    const { renderedQuestion, hints } = renderQuestionText(question.text);
                    return (
                        <div key={idx} style={s.card}>
                            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 500, color: 'var(--text-head)', marginBottom: '0.7rem', lineHeight: 1.55 }}>
                                <span style={{ color: 'var(--accent)', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 600, marginRight: '0.35rem' }}>{idx + 1}.</span>
                                {renderedQuestion}
                            </label>

                            {hints.length > 0 && (
                                <div style={{ marginBottom: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                    {hints.map((hint, hi) => {
                                        const k = `${idx}-${hi}`;
                                        const shown = !!revealedHints[k];
                                        return (
                                            <div key={hi}>
                                                <button onClick={() => toggleHint(idx, hi)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0, fontFamily: "'Inter', sans-serif" }}>
                                                    {shown ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                                    {hint.preview}
                                                </button>
                                                {shown && (
                                                    <div style={{ marginTop: '0.3rem', marginLeft: '1rem', background: 'var(--hint-bg)', border: '1px solid var(--hint-border)', borderRadius: '0.5rem', padding: '0.55rem 0.8rem', fontSize: '0.86rem', color: 'var(--text-body)' }}>
                                                        {renderHintText(hint.fullText)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <textarea
                                value={answers[idx]}
                                onChange={e => handleAnswerChange(idx, e.target.value)}
                                style={{ width: '100%', minHeight: '5.5rem', padding: '0.7rem 0.95rem', border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'var(--bg-surface-alt)', color: 'var(--text-body)', fontSize: '0.9rem', fontFamily: "'Inter', sans-serif", outline: 'none', resize: 'vertical', transition: 'border-color 0.2s' }}
                                placeholder="Your answer…"
                                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                        </div>
                    );
                })}

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem' }}>
                    <button onClick={onCancel} style={{ flex: 1, ...s.btn, background: 'var(--bg-surface)', color: 'var(--text-body)', border: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        Cancel
                    </button>
                    <button onClick={handleSubmit} style={{ flex: 2, ...s.btn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                    >
                        <CheckCircle size={17} />
                        Submit & Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TestPage;
