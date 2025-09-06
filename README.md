# Academic Paper Summarizer

An intelligent academic assistant that uses the Google Gemini API to summarize scientific research papers. It extracts key information like objectives, methods, and findings, and can provide a comparative analysis for multiple papers.

![Academic Paper Summarizer UI](https://storage.googleapis.com/aistudio-project-jekyll-blog/2024/05/85f1c951-summarize-papers-screenshot.png)

## ✨ Key Features

- **AI-Powered Summaries**: Leverages the `gemini-2.5-flash` model to generate structured, concise, and objective summaries of dense academic texts.
- **Comparative Analysis**: When multiple papers are provided, the tool generates a comparative summary highlighting the similarities and differences in their objectives, methods, and results.
- **Multiple Input Formats**: Supports pasting text directly, uploading `.txt` files, and uploading `.pdf` files. The app automatically extracts text from PDFs on the client-side.
- **Drag & Drop Upload**: A user-friendly interface allows you to simply drag and drop your paper files into the application.
- **Persistent Personal Library**: Save your generated summaries to a local library (using browser `localStorage`) to access them anytime you revisit the app.
- **Clean & Intuitive UI**: A modern, responsive, and academic-themed interface built with React and Tailwind CSS for a seamless user experience.

## 🚀 How to Use

1.  **Add a Paper**:
    -   Navigate to the **Summarizer** tab.
    -   Use the "Paste Text" tab to paste the content of your research paper.
    -   Alternatively, switch to the "Upload File" tab to select a `.txt` or `.pdf` file, or simply drag and drop a file onto the designated area.

2.  **Add More Papers for Comparison**:
    -   Click the **"Add Another Paper"** button to create a new input card.
    -   Add content for the second paper using the same methods. The title will dynamically change to "Summarize & Compare Papers".

3.  **Generate Summaries**:
    -   Once all papers are added, click the **"Summarize & Compare"** button.
    -   The application will display individual structured summaries for each paper and a comparative analysis if more than one paper was provided.

4.  **Save to Library**:
    -   After reviewing the results, click **"Save to Library"** to store the summaries for future reference.

5.  **Access Your Library**:
    -   Click on the **"Library"** tab in the sidebar to view, read, or delete your saved summaries.

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Tailwind CSS
-   **AI Model**: Google Gemini API (`gemini-2.5-flash`) via `@google/genai` SDK
-   **PDF Parsing**: [PDF.js](https://mozilla.github.io/pdf.js/) for client-side text extraction

## 📁 File Structure

The project is organized into a clean and modular structure:

```
.
├── index.html          # Main HTML entry point, loads scripts and styles
├── index.tsx           # React application root
├── App.tsx             # Main application component, handles state and UI logic
├── components/
│   ├── PaperInput.tsx  # Component for text/file input
│   ├── Spinner.tsx     # Loading spinner component
│   └── SummaryCard.tsx # Component to display a structured summary
├── services/
│   └── geminiService.ts# Handles all communication with the Gemini API
└── types.ts            # TypeScript type definitions for the application
```

## ⚙️ Running Locally

To run this application, you need to serve the files on a local web server.

1.  **Environment Variable**:
    -   This project requires a Google Gemini API key. It must be available as an environment variable named `API_KEY`. The application is configured to read this key directly from `process.env.API_KEY`.

2.  **Serve the Application**:
    -   You can use any simple local web server. For example, if you have Python installed, you can run:
        ```bash
        python -m http.server
        ```
    -   Or, using Node.js with the `serve` package:
        ```bash
        npx serve .
        ```
    -   Open your web browser and navigate to the local address provided by the server (e.g., `http://localhost:8000`).

