
import React from 'react';
import type { PaperSummary } from '../types';

interface SummaryCardProps {
    summary: PaperSummary;
    titlePrefix?: string;
}

const SummarySection: React.FC<{ title: string; content: string }> = ({ title, content }) => (
    <div>
        <h3 className="text-md font-semibold text-slate-800 font-sans">{title}</h3>
        <p className="text-slate-600 mt-1 font-serif">{content}</p>
    </div>
);

const SummaryCard: React.FC<SummaryCardProps> = ({ summary, titlePrefix }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80">
            <h2 className="text-xl font-bold text-sky-800 mb-4 font-sans border-b pb-3">
                {titlePrefix && <span className="mr-2">{titlePrefix}:</span>}
                <span className="italic font-serif">{summary.title}</span>
            </h2>
            <div className="space-y-4">
                <SummarySection title="1. Main Objective" content={summary.mainObjective} />
                <SummarySection title="2. Methodology" content={summary.methodology} />
                <SummarySection title="3. Key Findings" content={summary.keyFindings} />
                <SummarySection title="4. Implications" content={summary.implications} />
            </div>
        </div>
    );
};

export default SummaryCard;
