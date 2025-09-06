import React, { useState, useCallback, useEffect } from 'react';
import { summarizePapers } from './services/geminiService';
import type { PaperSummary, MultiPaperResponse, RawPaperSummary } from './types';
import PaperInput from './components/PaperInput';
import SummaryCard from './components/SummaryCard';
import Spinner from './components/Spinner';

type View = 'summarizer' | 'library';
type PaperInputState = { id: number; content: string; fileName?: string };

const App: React.FC = () => {
    const [papers, setPapers] = useState<PaperInputState[]>([{ id: Date.now(), content: '' }]);
    const [library, setLibrary] = useState<PaperSummary[]>([]);
    const [currentResult, setCurrentResult] = useState<{ summaries: PaperSummary[], comparativeSummary: string | null } | null>(null);
    const [view, setView] = useState<View>('summarizer');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedLibraryItem, setSelectedLibraryItem] = useState<PaperSummary | null>(null);

    useEffect(() => {
        try {
            const savedLibrary = localStorage.getItem('paper-summarizer-library');
            if (savedLibrary) {
                setLibrary(JSON.parse(savedLibrary));
            }
        } catch (e) {
            console.error("Failed to load library from localStorage", e);
        }
    }, []);

    const saveLibrary = (updatedLibrary: PaperSummary[]) => {
        setLibrary(updatedLibrary);
        localStorage.setItem('paper-summarizer-library', JSON.stringify(updatedLibrary));
    };
    
    const handlePaperContentChange = (index: number, content: string, fileName?: string) => {
        const newPapers = [...papers];
        // FIX: Corrected a reference error. 'paper' was not defined. It should be 'newPapers[index]' to refer to the current paper being updated.
        newPapers[index] = { ...newPapers[index], content, fileName: fileName || newPapers[index].fileName };
        setPapers(newPapers);
    };

    const addPaper = () => {
        setPapers([...papers, { id: Date.now(), content: '' }]);
    };

    const removePaper = (index: number) => {
        if (papers.length > 1) {
            setPapers(papers.filter((_, i) => i !== index));
        }
    };

    const handleSummarize = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setCurrentResult(null);

        try {
            const paperContents = papers.map(p => p.content).filter(p => p.trim() !== '');
            if (paperContents.length === 0) {
                 setError("Please add content to at least one paper before summarizing.");
                 setIsLoading(false);
                 return;
            }

            const result = await summarizePapers(paperContents);
            
            const processRawSummaries = (rawSummaries: RawPaperSummary[]): PaperSummary[] => {
                return rawSummaries.map(summary => ({
                    ...summary,
                    id: `summary-${Date.now()}-${Math.random()}`,
                    createdAt: Date.now(),
                }));
            };

            if (Array.isArray(result)) {
                setCurrentResult({ summaries: processRawSummaries(result), comparativeSummary: null });
            } else {
                const multiResponse = result as MultiPaperResponse;
                setCurrentResult({
                    summaries: processRawSummaries(multiResponse.individualSummaries),
                    comparativeSummary: multiResponse.comparativeSummary,
                });
            }
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [papers]);
    
    const saveResultToLibrary = () => {
        if (currentResult) {
            const newItems = currentResult.summaries.filter(
                summary => !library.some(libItem => libItem.title === summary.title)
            );
            if (newItems.length > 0) {
                saveLibrary([...library, ...newItems]);
            }
            alert(`${newItems.length} new summary/summaries saved to library!`);
        }
    };

    const removeFromLibrary = (id: string) => {
        if (window.confirm("Are you sure you want to remove this summary from your library?")) {
            const updatedLibrary = library.filter(item => item.id !== id);
            saveLibrary(updatedLibrary);
            if(selectedLibraryItem?.id === id) {
                setSelectedLibraryItem(null);
            }
        }
    };

    const resetSummarizer = () => {
        setCurrentResult(null);
        setPapers([{ id: Date.now(), content: '' }]);
        setError(null);
    }

    const hasContent = papers.some(p => p.content.trim() !== '');
    
    const sortedLibrary = [...library].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="min-h-screen flex font-sans bg-slate-50 text-slate-800">
            {/* Sidebar */}
            <nav className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col flex-shrink-0">
                <div className="flex items-center space-x-3 mb-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h1 className="text-xl font-bold text-slate-800">Paper Summarizer</h1>
                </div>
                <ul className="space-y-2">
                    <NavItem icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} label="Summarizer" active={view === 'summarizer'} onClick={() => { setView('summarizer'); setSelectedLibraryItem(null); }} />
                    <NavItem icon={<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />} label="Library" active={view === 'library'} onClick={() => setView('library')} count={library.length} />
                </ul>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                {view === 'summarizer' && (
                    <>
                        {!currentResult && !isLoading && <SummarizerInputView papers={papers} onContentChange={handlePaperContentChange} onRemove={removePaper} onAdd={addPaper} onSubmit={handleSummarize} isLoading={isLoading} hasContent={hasContent} error={error} />}
                        {isLoading && <LoadingView />}
                        {currentResult && !isLoading && <ResultsView result={currentResult} onSave={saveResultToLibrary} onReset={resetSummarizer} />}
                    </>
                )}
                {view === 'library' && <LibraryView library={sortedLibrary} onRemove={removeFromLibrary} selectedItem={selectedLibraryItem} setSelectedItem={setSelectedLibraryItem} />}
            </main>
        </div>
    );
};

const NavItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number}> = ({icon, label, active, onClick, count}) => (
    <li>
        <button onClick={onClick} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${active ? 'bg-sky-100 text-sky-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{icon}</svg>
            <span className="flex-1 text-left">{label}</span>
            {count !== undefined && count > 0 && <span className="text-xs font-semibold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{count}</span>}
        </button>
    </li>
);

const SummarizerInputView: React.FC<{papers: PaperInputState[], onContentChange: any, onRemove: any, onAdd: any, onSubmit: any, isLoading: boolean, hasContent: boolean, error: string | null}> = ({papers, onContentChange, onRemove, onAdd, onSubmit, isLoading, hasContent, error}) => (
    <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-6">
            {papers.length > 1 ? 'Summarize & Compare Papers' : 'Summarize New Papers'}
        </h2>
        <div className="space-y-4 mb-6">
            {papers.map((paper, index) => (
                <PaperInput key={paper.id} index={index} paper={paper} onContentChange={onContentChange} onRemove={onRemove} isOnlyOne={papers.length === 1}/>
            ))}
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={onAdd} className="flex items-center justify-center px-4 py-2 border border-dashed border-slate-400 text-slate-600 rounded-md hover:bg-slate-100 hover:border-slate-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add Another Paper
            </button>
            <button onClick={onSubmit} disabled={isLoading || !hasContent} className="flex items-center justify-center px-6 py-2 bg-sky-600 text-white font-semibold rounded-md shadow-md hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
                {isLoading ? <><Spinner /> Summarizing...</> : (papers.length > 1 ? 'Summarize & Compare' : 'Summarize')}
            </button>
        </div>
        {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">{error}</div>}
    </div>
);

const LoadingView = () => (
    <div className="flex flex-col justify-center items-center h-full text-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Analyzing papers, please wait...</p>
        <p className="mt-1 text-sm text-slate-500">This may take a moment, especially for large documents.</p>
    </div>
);

const ResultsView: React.FC<{result: { summaries: PaperSummary[], comparativeSummary: string | null }, onSave: () => void, onReset: () => void}> = ({result, onSave, onReset}) => (
    <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-800">Generated Summaries</h2>
            <div className="flex space-x-3">
                 <button onClick={onReset} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors">Start New</button>
                <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-colors">Save to Library</button>
            </div>
        </div>
        <div className="space-y-6">
            {result.summaries.map((summary, index) => <SummaryCard key={summary.id} summary={summary} titlePrefix={`Summary for Paper ${index + 1}`} />)}
            {result.comparativeSummary && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200/80">
                    <h2 className="text-xl font-bold text-sky-800 mb-4 font-sans border-b pb-3">Comparative Summary</h2>
                    <p className="text-slate-600 mt-1 font-serif whitespace-pre-wrap">{result.comparativeSummary}</p>
                </div>
            )}
        </div>
    </div>
);

const LibraryView: React.FC<{library: PaperSummary[], onRemove: (id: string) => void, selectedItem: PaperSummary | null, setSelectedItem: (item: PaperSummary | null) => void}> = ({ library, onRemove, selectedItem, setSelectedItem }) => {
    if (selectedItem) {
        return (
            <div className="max-w-4xl mx-auto">
                <button onClick={() => setSelectedItem(null)} className="flex items-center text-sm font-medium text-sky-600 hover:text-sky-800 mb-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     Back to Library
                </button>
                <SummaryCard summary={selectedItem} />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Library</h2>
            {library.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 bg-slate-100/80 border-2 border-dashed border-slate-300 rounded-lg text-center p-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <p className="text-slate-500 font-medium">Your library is empty.</p>
                    <p className="text-sm text-slate-400">Saved summaries will appear here.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {library.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center transition-shadow hover:shadow-md">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-800 truncate">{item.title}</h3>
                                <p className="text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex space-x-2 flex-shrink-0 ml-4">
                                <button onClick={() => setSelectedItem(item)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-sky-600 transition-colors" aria-label="View Summary"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                <button onClick={() => onRemove(item.id)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 hover:text-red-600 transition-colors" aria-label="Remove from Library"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default App;
