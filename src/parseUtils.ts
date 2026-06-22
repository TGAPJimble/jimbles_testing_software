// ── Markdown parsing, variant expansion, and supporting utilities ──────────

export interface Topic {
    name: string;
    questions: string[];
}

// Remove bold markdown and hint lines from question text
export const stripMarkdownAndHints = (text: string): string =>
    text.split('\n').filter(l => !l.trim().startsWith('Hint:')).join(' ').replace(/\*\*(.*?)\*\*/g, '$1').trim();

// Parse a .md test file into an array of topics with their question templates
export const parseMarkdown = (content: string): Topic[] => {
    const lines = content.split('\n');
    const topics: Topic[] = [];
    let currentTopic: Topic | null = null;
    let currentQuestion = '';

    const save = () => {
        if (currentQuestion.trim() && currentTopic) {
            currentTopic.questions.push(currentQuestion.trim());
            currentQuestion = '';
        }
    };

    for (const line of lines) {
        if (line.trim().startsWith('#') || line.trim() === '') continue;
        if (line.trim().endsWith(':')) {
            save();
            currentTopic = { name: line.trim().slice(0, -1), questions: [] };
            topics.push(currentTopic);
        } else if (currentTopic && /^\d+\./.test(line.trim())) {
            save();
            currentQuestion = line.trim().replace(/^\d+\.\s*/, '');
        } else if (currentTopic && currentQuestion) {
            currentQuestion += '\n' + line.trim();
        }
    }
    save();
    return topics;
};

// Check whether a variant's chosen-option indices satisfy a filter string
// e.g. filterStr="1; 2-3" and indices=[1, 2] → true
const matchVariantFilter = (filterStr: string, indices: number[]): boolean => {
    if (!filterStr) return true;
    const selectors = filterStr.split(';').map(s => s.trim());
    for (let i = 0; i < indices.length; i++) {
        const selector = selectors[i];
        if (selector === undefined || selector === '*') continue;
        let matched = false;
        for (const part of selector.split(',').map(p => p.trim())) {
            if (part.includes('-')) {
                const [min, max] = part.split('-').map(Number);
                if (indices[i] >= min && indices[i] <= max) matched = true;
            } else if (Number(part) === indices[i]) {
                matched = true;
            }
        }
        if (!matched) return false;
    }
    return true;
};

// Expand a question template with [A, B, C] brackets into all variant strings,
// attaching only the hints whose filters match each variant.
export const generateVariants = (questionTemplate: string): string[] => {
    const lines = questionTemplate.split('\n');
    const baseLines: string[] = [];
    const hintLines: string[] = [];

    for (const line of lines) {
        if (line.trim().startsWith('Hint:')) hintLines.push(line);
        else baseLines.push(line);
    }

    const baseText = baseLines.join('\n');
    const matches = [...baseText.matchAll(/\[([^\]]+)\]/g)];

    if (!matches.length) {
        let finalStr = baseText;
        for (const hl of hintLines) {
            const filterMatch = hl.match(/\}\s*\[([^\]]+)\]\s*$/);
            finalStr += '\n' + (filterMatch ? hl.substring(0, filterMatch.index! + 1) : hl);
        }
        return [finalStr];
    }

    let variants: { text: string; indices: number[] }[] = [{ text: baseText, indices: [] }];

    for (const match of matches) {
        const options = match[1].split(',').map(o => o.trim());
        const next: { text: string; indices: number[] }[] = [];
        for (const v of variants) {
            options.forEach((o, idx) => {
                next.push({ text: v.text.replace(match[0], o), indices: [...v.indices, idx + 1] });
            });
        }
        variants = next;
    }

    return variants.map(v => {
        let finalStr = v.text;
        for (const hl of hintLines) {
            const filterMatch = hl.match(/\}\s*\[([^\]]+)\]\s*$/);
            if (filterMatch) {
                if (matchVariantFilter(filterMatch[1], v.indices)) {
                    finalStr += '\n' + hl.substring(0, filterMatch.index! + 1);
                }
            } else {
                finalStr += '\n' + hl;
            }
        }
        return finalStr;
    });
};

// Fisher-Yates shuffle (returns a new array)
export const shuffleArray = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
