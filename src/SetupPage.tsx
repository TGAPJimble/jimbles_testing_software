import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Server, Plus } from 'lucide-react';
import { s } from './styles';
import PaletteSwitcher from './PaletteSwitcher';
import { parseMarkdown, generateVariants, shuffleArray, type Topic } from './parseUtils';

interface SetupPageProps {
    onGenerateTest: (questions: any[]) => void;
    onCreateTest: () => void;
}

const SetupPage: React.FC<SetupPageProps> = ({ onGenerateTest, onCreateTest }) => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [numTopics, setNumTopics] = useState('all');
    const [numQuestions, setNumQuestions] = useState('all');
    const [showTopicSelector, setShowTopicSelector] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<Record<number, boolean>>({});
    const [loadedFiles, setLoadedFiles] = useState<{ name: string; topics: Topic[]; isHosted?: boolean }[]>([]);
    const [hostedFiles, setHostedFiles] = useState<{ filename: string; loaded: boolean }[]>([]);
    const [loadingHosted, setLoadingHosted] = useState(false);
    const [palette, setPalette] = useState('rose-petal');

    useEffect(() => {
        document.documentElement.setAttribute('data-palette', palette);
    }, [palette]);

    useEffect(() => {
        fetch('/api/tests')
            .then(r => { if (!r.ok) throw new Error(); return r.json(); })
            .then(d => setHostedFiles((d.files || []).map(f => ({ filename: f, loaded: false }))))
            .catch(() => { });
    }, []);

    // ── File loading ────────────────────────────────────────────────────────

    const addTopicsFromParsed = (parsedTopics: Topic[]) => {
        setTopics(prev => {
            const combined = [...prev, ...parsedTopics];
            setSelectedTopics(ps => {
                const u = { ...ps };
                parsedTopics.forEach((_, i) => { u[prev.length + i] = true; });
                return u;
            });
            return combined;
        });
    };

    const toggleHostedFile = async (filename: string) => {
        const alreadyLoaded = loadedFiles.some(f => f.name === filename);
        if (alreadyLoaded) {
            const fileIndex = loadedFiles.findIndex(f => f.name === filename);
            if (fileIndex !== -1) removeFile(fileIndex);
            setHostedFiles(prev => prev.map(f => f.filename === filename ? { ...f, loaded: false } : f));
            return;
        }
        setLoadingHosted(true);
        try {
            const r = await fetch('/api/tests/' + filename);
            if (!r.ok) throw new Error('Failed to fetch file');
            const parsedTopics = parseMarkdown(await r.text());
            setLoadedFiles(prev => [...prev, { name: filename, topics: parsedTopics, isHosted: true }]);
            addTopicsFromParsed(parsedTopics);
            setHostedFiles(prev => prev.map(f => f.filename === filename ? { ...f, loaded: true } : f));
        } catch (e: any) {
            alert(`Error loading ${filename}: ${e.message}`);
        }
        setLoadingHosted(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;
        Array.from(files).forEach((file: File) => {
            if (loadedFiles.some(f => f.name === file.name)) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const parsedTopics = parseMarkdown(evt.target!.result as string);
                setLoadedFiles(prev => [...prev, { name: file.name, topics: parsedTopics }]);
                addTopicsFromParsed(parsedTopics);
            };
            reader.readAsText(file);
        });
        e.target.value = '';
    };

    const removeFile = (fileIndex: number) => {
        const toRemove = loadedFiles[fileIndex];
        let topicStart = 0;
        for (let i = 0; i < fileIndex; i++) topicStart += loadedFiles[i].topics.length;
        setLoadedFiles(prev => prev.filter((_, i) => i !== fileIndex));
        setTopics(prev => {
            const updated = [...prev];
            updated.splice(topicStart, toRemove.topics.length);
            setSelectedTopics(ps => {
                const ns: Record<number, boolean> = {};
                let ni = 0;
                Object.keys(ps).forEach(k => {
                    const idx = parseInt(k);
                    if (idx < topicStart || idx >= topicStart + toRemove.topics.length) ns[ni++] = ps[idx];
                });
                return ns;
            });
            return updated;
        });
    };

    // ── Topic selection ─────────────────────────────────────────────────────

    const toggleTopic = (i: number) => { setNumTopics('manual'); setSelectedTopics(p => ({ ...p, [i]: !p[i] })); };
    const selectAllTopics = () => { setNumTopics('manual'); const a: Record<number, boolean> = {}; topics.forEach((_, i) => a[i] = true); setSelectedTopics(a); };
    const unselectAllTopics = () => { setNumTopics('manual'); const a: Record<number, boolean> = {}; topics.forEach((_, i) => a[i] = false); setSelectedTopics(a); };
    const selectedCount = () => Object.values(selectedTopics).filter(Boolean).length;

    // ── Test generation ─────────────────────────────────────────────────────

    const handleGenerateTest = () => {
        if (!topics.length) return;
        const topicsToUse = numTopics === 'manual'
            ? topics.filter((_, i) => selectedTopics[i])
            : numTopics === 'all' ? [...topics]
                : shuffleArray([...topics]).slice(0, parseInt(numTopics));

        const testQuestions: any[] = [];
        for (const topic of topicsToUse) {
            const variants: any[] = [];
            topic.questions.forEach((q, i) =>
                generateVariants(q).forEach(v => variants.push({ topicName: topic.name, originalIndex: i, text: v }))
            );
            testQuestions.push(...(numQuestions !== 'all' ? shuffleArray(variants).slice(0, parseInt(numQuestions)) : variants));
        }
        onGenerateTest(shuffleArray(testQuestions));
    };

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div style={s.pageWrap}>
            <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ ...s.card, padding: '2rem 2.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <p style={s.label}>Test Taking</p>
                            <h1 style={s.heading}>Question Studio</h1>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.88rem' }}>
                                Select your sources and configure the test below
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                            <FileText size={34} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.4rem' }} />
                            <button onClick={onCreateTest} style={{ ...s.btnGhost, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Plus size={14} /> Create New Test</button>
                        </div>
                    </div>
                    <hr style={s.divider} />
                    <p style={s.label}>Color Palette</p>
                    <PaletteSwitcher current={palette} onChange={setPalette} />
                </div>

                {/* Two-column layout */}
                <div style={{ display: 'grid', gridTemplateColumns: topics.length > 0 ? '1fr 1fr' : '1fr', gap: '1.1rem' }}>

                    {/* Left: file loading */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                        {hostedFiles.length > 0 && (
                            <div style={s.cardAlt}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <Server size={17} style={{ color: 'var(--accent)' }} />
                                    <h2 style={{ ...s.subheading, margin: 0 }}>Available Test Files</h2>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                                    Click to load · click again to unload
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {hostedFiles.map((file, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => toggleHostedFile(file.filename)}
                                            disabled={loadingHosted && !file.loaded}
                                            style={{ ...(file.loaded ? s.btnLoaded : s.btnFile), opacity: loadingHosted && !file.loaded ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <span>{file.filename.replace(/\.md$/i, '').replace(/_/g, ' ')}</span>
                                            {file.loaded && <span style={{ fontSize: '0.72rem', opacity: 0.75, fontWeight: 500 }}>✓ loaded · click to remove</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={s.card}>
                            <p style={s.label}>Upload Your Own Files</p>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <label style={{ ...s.btnFile, display: 'inline-block', cursor: 'pointer' }}>
                                    Browse files (.md)
                                    <input type="file" accept=".md" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>
                                <label style={{ ...s.btnFile, display: 'inline-block', cursor: 'pointer' }}>
                                    Add folder
                                    {/* @ts-ignore */}
                                    <input type="file" accept=".md" multiple webkitdirectory="" directory="" onChange={handleFileUpload} style={{ display: 'none' }} />
                                </label>
                            </div>
                            <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Individual <code>.md</code> files or an entire folder
                            </p>
                        </div>

                        {loadedFiles.length > 0 && (
                            <div style={s.card}>
                                <p style={s.label}>{loadedFiles.length} file{loadedFiles.length !== 1 ? 's' : ''} loaded</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {loadedFiles.map((file, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', borderRadius: '0.6rem', padding: '0.55rem 0.85rem', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                                {file.isHosted && <Server size={12} style={{ color: 'var(--accent)' }} />}
                                                <span style={{ fontSize: '0.83rem', color: 'var(--text-body)', fontWeight: 500 }}>{file.name.replace(/\.md$/i, '').replace(/_/g, ' ')}</span>
                                                <span style={s.tag}>{file.topics.length} topics</span>
                                                <span style={s.tag}>{file.topics.reduce((n, t) => n + t.questions.length, 0)} q</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (file.isHosted) setHostedFiles(prev => prev.map(f => f.filename === file.name ? { ...f, loaded: false } : f));
                                                    removeFile(idx);
                                                }}
                                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: topics + config */}
                    {topics.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                            {/* Topics summary */}
                            <div style={{ ...s.card, background: 'var(--confirm-bg)', borderColor: 'var(--confirm-border)', padding: '1.25rem 1.75rem' }}>
                                <p style={{ color: 'var(--confirm-text)', fontWeight: 600, fontSize: '0.86rem', marginBottom: '0.6rem' }}>
                                    ✓ {topics.length} topic{topics.length !== 1 ? 's' : ''} ready
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {topics.map((t, i) => (
                                        <span key={i} style={s.tag}>
                                            {t.name} <span style={{ opacity: 0.65 }}>({t.questions.length})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Config card */}
                            <div style={s.card}>
                                <h2 style={s.subheading}>Configure Test</h2>

                                {/* Topic count dropdown + manual selector */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                        <label style={s.label}>Number of Topics</label>
                                        <button style={s.btnGhost} onClick={() => setShowTopicSelector(v => !v)}>
                                            {showTopicSelector ? 'Hide' : 'Manual select'}
                                        </button>
                                    </div>
                                    <select value={numTopics} onChange={e => setNumTopics(e.target.value)} style={s.select}>
                                        <option value="all">All topics</option>
                                        <option value="manual">Manual selection ({selectedCount()} selected)</option>
                                        {[...Array(topics.length)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                                        ))}
                                    </select>

                                    {showTopicSelector && (
                                        <div style={{ marginTop: '0.65rem', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.85rem', background: 'var(--bg-surface-alt)', maxHeight: '13rem', overflowY: 'auto' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                    {selectedCount()} of {topics.length} selected
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button style={s.btnGhost} onClick={selectAllTopics}>All</button>
                                                    <button style={s.btnGhost} onClick={unselectAllTopics}>None</button>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                {topics.map((topic, i) => (
                                                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', padding: '0.3rem 0.45rem', borderRadius: '0.5rem', background: selectedTopics[i] ? 'var(--accent-light)' : 'transparent', transition: 'background 0.15s' }}>
                                                        <input type="checkbox" checked={!!selectedTopics[i]} onChange={() => toggleTopic(i)} style={{ accentColor: 'var(--accent)', width: '0.95rem', height: '0.95rem' }} />
                                                        <span style={{ fontSize: '0.83rem', color: 'var(--text-body)', flex: 1 }}>{topic.name}</span>
                                                        <span style={s.tag}>{topic.questions.length} q</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Questions per topic */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={s.label}>Questions per Topic</label>
                                    <select value={numQuestions} onChange={e => setNumQuestions(e.target.value)} style={s.select}>
                                        <option value="all">All questions</option>
                                        {[1, 2, 3, 5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>

                                <button
                                    onClick={handleGenerateTest}
                                    style={{ ...s.btn, width: '100%', fontSize: '0.95rem', padding: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                                >
                                    <CheckCircle size={17} />
                                    Generate Test
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupPage;
