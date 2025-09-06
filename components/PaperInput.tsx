import React, { useState, useRef } from 'react';

// pdf.js is loaded from a CDN in index.html, so we declare it here to use it
declare const pdfjsLib: any;

interface PaperInputProps {
    index: number;
    paper: { id: number; content: string; fileName?: string };
    onContentChange: (index: number, content: string, fileName?: string) => void;
    onRemove: (index: number) => void;
    isOnlyOne: boolean;
}

const PaperInput: React.FC<PaperInputProps> = ({ index, paper, onContentChange, onRemove, isOnlyOne }) => {
    const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file) return;

        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                onContentChange(index, text, file.name);
            };
            reader.readAsText(file);
        } else if (file.type === "application/pdf") {
            onContentChange(index, "Reading PDF...", file.name); // Provide immediate feedback
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument(arrayBuffer);
                const pdf = await loadingTask.promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(' ');
                    fullText += pageText + '\n\n'; // Add space between pages
                }
                onContentChange(index, fullText.trim(), file.name);
            } catch (error) {
                console.error("Error parsing PDF:", error);
                const errorMessage = "Error: Could not read the PDF file. The file might be corrupted, password-protected, or image-based. Please try pasting the content instead.";
                onContentChange(index, errorMessage, file.name);
                alert(errorMessage);
            }
        } else {
            alert("Only .txt and .pdf files are supported. For other file types, please paste the text manually.");
            onContentChange(index, '', file.name);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        handleFile(file!);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFile(file!);
    };

    const TabButton: React.FC<{tabName: 'paste' | 'upload'; label: string;}> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-500 hover:bg-slate-100'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-slate-700">Paper {index + 1}</h3>
                {!isOnlyOne && (
                    <button
                        onClick={() => onRemove(index)}
                        className="p-1.5 text-slate-400 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                        aria-label={`Remove Paper ${index + 1}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            <div className="flex space-x-2 mb-3 border-b border-slate-200">
                <TabButton tabName="paste" label="Paste Text" />
                <TabButton tabName="upload" label="Upload File" />
            </div>
            <div>
                {activeTab === 'paste' && (
                    <textarea
                        value={paper.content}
                        onChange={(e) => onContentChange(index, e.target.value, undefined)}
                        placeholder="Paste the full text of the scientific paper here..."
                        rows={8}
                        className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-serif text-sm"
                    />
                )}
                {activeTab === 'upload' && (
                    <div 
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 hover:border-slate-400'}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".txt,.pdf"
                        />
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {paper.fileName ? (
                             <p className="text-sm font-medium text-green-600">{paper.fileName}</p>
                        ) : (
                             <p className="text-sm text-slate-500"><span className="font-semibold text-sky-600">Click to upload</span> or drag and drop</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">Supports .txt and .pdf files</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaperInput;