import React from 'react';
import { PALETTES } from './palettes';

interface PaletteSwitcherProps {
    current: string;
    onChange: (id: string) => void;
}

// ── Palette Switcher ───────────────────────────────────────────────────────
const PaletteSwitcher: React.FC<PaletteSwitcherProps> = ({ current, onChange }) => (
    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {PALETTES.map(p => (
            <button
                key={p.id}
                title={`${p.name} — ${p.desc}`}
                onClick={() => onChange(p.id)}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: 'none',
                    border: `2px solid ${current === p.id ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: '0.75rem',
                    padding: '0.35rem 0.55rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                }}
            >
                <div style={{ display: 'flex', borderRadius: '0.35rem', overflow: 'hidden', width: '2.8rem', height: '1.1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                    {p.swatches.map((col, i) => (
                        <div key={i} style={{ flex: i === 0 ? 3 : i === 1 ? 1.5 : 0.5, background: col }} />
                    ))}
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: current === p.id ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'color 0.2s' }}>
                    {p.name}
                </span>
            </button>
        ))}
    </div>
);

export default PaletteSwitcher;
