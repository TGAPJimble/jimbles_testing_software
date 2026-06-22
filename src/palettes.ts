// ── Palette definitions ────────────────────────────────────────────────────
export const PALETTES = [
    { id: 'rose-petal',  name: 'Rose Petal',  desc: 'Blush & dusty rose',       swatches: ['#fdf0f3', '#f9d5dd', '#c4687a'] },
    { id: 'powder-blue', name: 'Powder Blue', desc: 'Sky & cornflower',          swatches: ['#eff5fb', '#c8dcf0', '#4a7db5'] },
    { id: 'sage-garden', name: 'Sage Garden', desc: 'Pale mint & sage',          swatches: ['#f0f6f0', '#c8dcc8', '#4d8a5a'] },
    { id: 'peach-bloom', name: 'Peach Bloom', desc: 'Warm cream & apricot',      swatches: ['#fdf6ef', '#f5d5bc', '#c07040'] },
    { id: 'lilac-dream', name: 'Lilac Dream', desc: 'Pale lavender & violet',    swatches: ['#f5f0fb', '#d8c8f0', '#7050b0'] },
];

export type PaletteId = typeof PALETTES[number]['id'];
