import React, { useState } from 'react';
import './index.css';
import SetupPage from './SetupPage';
import TestPage from './TestPage';
import CreatorPage from './CreatorPage';

// ── App: top-level page router ─────────────────────────────────────────────
export default function App() {
    const [page, setPage] = useState('setup');
    const [questions, setQuestions] = useState<any[]>([]);

    const go = (qs: any[]) => { setQuestions(qs); setPage('test'); };
    const back = () => { setPage('setup'); setQuestions([]); };
    const goCreate = () => { setPage('creator'); };

    return page === 'setup'
        ? <SetupPage onGenerateTest={go} onCreateTest={goCreate} />
        : page === 'test'
            ? <TestPage questions={questions} onSubmit={back} onCancel={back} />
            : <CreatorPage onCancel={back} />;
}
