import React, { useState } from 'react';
import { CheckCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { s } from './styles';

interface HintDef {
    id: number;
    desc: string;
    hidden: string;
    filters: string[];
}

interface QuestionDef {
    id: number;
    text: string;
    hints: HintDef[];
}

interface TopicDef {
    id: number;
    name: string;
    questions: QuestionDef[];
}

interface CreatorPageProps {
    onCancel: () => void;
}

// Extract variation brackets [[A, B, C]] from question text
const getVariants = (text: string) =>
    [...text.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].split(',').map(s => s.trim()));

const CreatorPage: React.FC<CreatorPageProps> = ({ onCancel }) => {
    const [title, setTitle] = useState('');
    const [topics, setTopics] = useState<TopicDef[]>([
        { id: Date.now(), name: '', questions: [{ id: Date.now() + 1, text: '', hints: [] }] }
    ]);

    // ── Topic mutations ─────────────────────────────────────────────────────

    const addTopic = () => setTopics([...topics, { id: Date.now(), name: '', questions: [{ id: Date.now() + 1, text: '', hints: [] }] }]);
    const updateTopicName = (tIdx: number, name: string) => { const nt = [...topics]; nt[tIdx].name = name; setTopics(nt); };
    const removeTopic = (tIdx: number) => setTopics(topics.filter((_, i) => i !== tIdx));

    // ── Question mutations ──────────────────────────────────────────────────

    const addQuestion = (tIdx: number) => { const nt = [...topics]; nt[tIdx].questions.push({ id: Date.now(), text: '', hints: [] }); setTopics(nt); };
    const updateQuestion = (tIdx: number, qIdx: number, text: string) => { const nt = [...topics]; nt[tIdx].questions[qIdx].text = text; setTopics(nt); };
    const removeQuestion = (tIdx: number, qIdx: number) => { const nt = [...topics]; nt[tIdx].questions = nt[tIdx].questions.filter((_, i) => i !== qIdx); setTopics(nt); };

    const insertVariation = (tIdx: number, qIdx: number) => {
        const nt = [...topics];
        const q = nt[tIdx].questions[qIdx];
        q.text += (q.text && !q.text.endsWith(' ') ? ' ' : '') + '[Option 1, Option 2]';
        setTopics(nt);
    };

    // ── Hint mutations ──────────────────────────────────────────────────────

    const addHint = (tIdx: number, qIdx: number) => {
        const nt = [...topics];
        const variantsCount = getVariants(nt[tIdx].questions[qIdx].text).length;
        nt[tIdx].questions[qIdx].hints.push({ id: Date.now(), desc: '', hidden: '', filters: Array(Math.max(1, variantsCount)).fill('*') });
        setTopics(nt);
    };
    const updateHint = (tIdx: number, qIdx: number, hIdx: number, field: string, val: string) => { const nt = [...topics]; nt[tIdx].questions[qIdx].hints[hIdx][field] = val; setTopics(nt); };
    const updateHintFilter = (tIdx: number, qIdx: number, hIdx: number, fIdx: number, val: string) => { const nt = [...topics]; nt[tIdx].questions[qIdx].hints[hIdx].filters[fIdx] = val; setTopics(nt); };
    const removeHint = (tIdx: number, qIdx: number, hIdx: number) => { const nt = [...topics]; nt[tIdx].questions[qIdx].hints = nt[tIdx].questions[qIdx].hints.filter((_, i) => i !== hIdx); setTopics(nt); };

    // ── Download ────────────────────────────────────────────────────────────

    const handleDownload = () => {
        let md = '';
        topics.forEach(t => {
            const lines = t.questions.filter(q => q.text.trim());
            if (!t.name.trim() || lines.length === 0) return;
            md += `${t.name.trim()}:\n\n`;
            let qNum = 1;
            lines.forEach(q => {
                md += `${qNum++}. ${q.text.trim()}\n`;
                q.hints.forEach(h => {
                    if (!h.desc.trim() && !h.hidden.trim()) return;
                    const hText = h.hidden.trim() ? `${h.desc.trim()}, ${h.hidden.trim()}` : h.desc.trim();
                    const hasFilters = h.filters.some(f => f !== '*');
                    md += `Hint: {${hText}}`;
                    if (hasFilters || h.filters.length > 0) md += ` [${h.filters.join('; ')}]`;
                    md += '\n';
                });
            });
            md += '\n';
        });

        if (!md.trim()) { alert('Please add some Topics and Questions to generate a test file.'); return; }

        const safeFilename = (title || 'New_Test').replace(/[^a-z0-9-_]/gi, '_').toLowerCase() + '.md';
        const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url; a.download = safeFilename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div style={s.pageWrap}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
                <div style={{ ...s.card, padding: '2rem 2.5rem', marginBottom: '1.25rem' }}>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: 0, marginBottom: '0.75rem', fontSize: '0.86rem', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                        <ArrowLeft size={16} /> Back to Studio
                    </button>
                    <h1 style={s.heading}>Visual Test Creator</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.88rem' }}>Create custom test files easily — structure topics, format bracketed variants, and map context-aware hints.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
                    <div style={s.card}>
                        <label style={s.label}>Exported Filename</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. N5_Vocab_Quiz" style={{ width: '100%', padding: '0.75rem 1rem', ...s.inputStyle }} />
                    </div>

                    {topics.map((topic, tIdx) => (
                        <div key={topic.id} style={{ ...s.cardAlt, padding: '2rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <input value={topic.name} onChange={e => updateTopicName(tIdx, e.target.value)} placeholder="Topic Name" style={{ flex: 1, padding: '0.6rem 0.5rem', border: 'none', background: 'transparent', fontSize: '1.6rem', fontWeight: 500, color: 'var(--text-head)', fontFamily: "'Cormorant Garamond', serif", outline: 'none', borderBottom: '1px dashed var(--border)' }} />
                                <button onClick={() => removeTopic(tIdx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={20} /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {topic.questions.map((q, qIdx) => {
                                    const variants = getVariants(q.text);
                                    return (
                                        <div key={q.id} style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                                <div style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1.1rem', fontFamily: "'Cormorant Garamond', serif" }}>{qIdx + 1}.</div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                                    <textarea value={q.text} onChange={e => updateQuestion(tIdx, qIdx, e.target.value)} placeholder="Type question prompt here..." style={{ width: '100%', minHeight: '4.5rem', padding: '0.75rem 1rem', resize: 'vertical', ...s.inputStyle }} />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <button onClick={() => insertVariation(tIdx, qIdx)} style={{ ...s.btnGhost, display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}><Plus size={14} /> Add Variation [ A, B ]</button>
                                                        {variants.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected {variants.length} variation parameter(s)</span>}
                                                    </div>
                                                </div>
                                                <button onClick={() => removeQuestion(tIdx, qIdx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}><Trash2 size={16} /></button>
                                            </div>

                                            {q.hints.length > 0 && (
                                                <div style={{ marginTop: '1rem', marginLeft: '1.6rem', paddingLeft: '1.25rem', borderLeft: '2px solid var(--hint-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Configured Hints</h4>
                                                    {q.hints.map((h, hIdx) => {
                                                        while (h.filters.length < variants.length) h.filters.push('*');
                                                        return (
                                                            <div key={h.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center', background: 'var(--hint-bg)', border: '1px solid var(--hint-border)', padding: '0.85rem', borderRadius: '0.75rem' }}>
                                                                <input value={h.desc} onChange={e => updateHint(tIdx, qIdx, hIdx, 'desc', e.target.value)} placeholder="Pre-text (e.g. Existing verb is)" style={{ flex: 1.5, minWidth: '150px', padding: '0.5rem 0.75rem', ...s.inputStyle }} />
                                                                <input value={h.hidden} onChange={e => updateHint(tIdx, qIdx, hIdx, 'hidden', e.target.value)} placeholder="Hidden Answer (e.g. いる)" style={{ flex: 1, minWidth: '130px', padding: '0.5rem 0.75rem', ...s.inputStyle }} />
                                                                {variants.length > 0 && (
                                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
                                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Show when:</span>
                                                                        {variants.map((opts, vIdx) => (
                                                                            <select key={vIdx} value={h.filters[vIdx] || '*'} onChange={e => updateHintFilter(tIdx, qIdx, hIdx, vIdx, e.target.value)} style={{ ...s.select, padding: '0.35rem 2rem 0.35rem 0.65rem', fontSize: '0.75rem', minWidth: '110px' }}>
                                                                                <option value="*">All Variant {vIdx + 1}</option>
                                                                                {opts.map((opt, oIdx) => <option key={oIdx} value={oIdx + 1}>Opt: {opt.substring(0, 6)}...</option>)}
                                                                            </select>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <button onClick={() => removeHint(tIdx, qIdx, hIdx)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}><Trash2 size={15} /></button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            <div style={{ marginTop: '0.75rem', marginLeft: '1.6rem', paddingLeft: '1.25rem' }}>
                                                <button onClick={() => addHint(tIdx, qIdx)} style={{ ...s.btnGhost, padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>+ Add Context Hint</button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <button onClick={() => addQuestion(tIdx)} style={{ ...s.btnGhost, alignSelf: 'flex-start' }}><Plus size={14} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'text-bottom' }} /> Add Question to Topic</button>
                            </div>
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <button onClick={addTopic} style={{ ...s.btnFile, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-alt)' }}><Plus size={16} /> Add Topic Section</button>
                        <button onClick={handleDownload} style={{ ...s.btn, display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2.25rem', fontSize: '1rem' }}><CheckCircle size={18} /> Download Test File</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorPage;
