
import { GoogleGenAI, Type } from "@google/genai";
import type { RawPaperSummary, MultiPaperResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = "You are a highly skilled academic assistant specializing in the concise and accurate summarization of scientific research papers. Your summaries must be objective, preserve technical terminology, and follow the requested structure precisely. Each individual paper summary must be under 200 words.";

const singlePaperSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The full title of the paper." },
        mainObjective: { type: Type.STRING, description: "The primary goal or research question of the paper." },
        methodology: { type: Type.STRING, description: "A brief description of the methods used (e.g., experiments, datasets, models)." },
        keyFindings: { type: Type.STRING, description: "The most important results or conclusions." },
        implications: { type: Type.STRING, description: "What these findings mean for the field or future research." },
    },
    required: ["title", "mainObjective", "methodology", "keyFindings", "implications"]
};

const multiPaperSchema = {
    type: Type.OBJECT,
    properties: {
        individualSummaries: {
            type: Type.ARRAY,
            description: "An array of summaries, one for each paper provided.",
            items: singlePaperSchema,
        },
        comparativeSummary: {
            type: Type.STRING,
            description: "A comparative summary highlighting similarities and differences in objectives, methods, and results."
        }
    },
    required: ["individualSummaries", "comparativeSummary"]
};


export const summarizePapers = async (papers: string[]): Promise<RawPaperSummary[] | MultiPaperResponse> => {
    if (papers.length === 0 || papers.every(p => p.trim() === '')) {
        throw new Error("No paper content provided.");
    }

    const validPapers = papers.filter(p => p.trim() !== '');

    if (validPapers.length === 1) {
        const prompt = `Please analyze the following research paper and provide a structured summary. The summary for the paper must not exceed 200 words in total. \n\n---PAPER START---\n\n${validPapers[0]}\n\n---PAPER END---`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: singlePaperSchema,
            },
        });
        const parsedJson = JSON.parse(response.text);
        return [parsedJson as RawPaperSummary];
    } else {
        const prompt = `Please analyze the following ${validPapers.length} research papers. First, provide a structured summary for each paper individually. Each individual summary must not exceed 200 words. Then, provide a comparative summary highlighting the similarities and differences between the papers in their objectives, methods, and results.\n\n` +
            validPapers.map((paper, index) => `---PAPER ${index + 1} START---\n\n${paper}\n\n---PAPER ${index + 1} END---`).join('\n\n');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: multiPaperSchema,
            },
        });
        const parsedJson = JSON.parse(response.text);
        return parsedJson as MultiPaperResponse;
    }
};
