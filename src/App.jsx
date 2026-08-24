import { useCallback, useRef, useState } from "react";
import { extractDocument, summarizeDocument } from "./services/api";
import "./App.css";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function App() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [length, setLength] = useState("medium");

  const [stage, setStage] = useState("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const busy = stage !== "idle";

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      setError("Please upload a PDF, JPG, PNG, or WEBP file.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("This file appears to be empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum size is 10 MB.");
      return;
    }

    setFile(selectedFile);
    setText("");
    setSummary("");
    setError("");
    setStage("extracting");

    try {
      const result = await extractDocument(selectedFile);

      // Your API returns the extracted text directly.
      setText(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not extract text from the document."
      );
    } finally {
      setStage("idle");
    }
  }, []);

  const handleDrop = (event) => {
    event.preventDefault();

    if (busy) return;

    setDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleSummarize = async () => {
    if (!text.trim() || busy) return;

    setError("");
    setSummary("");
    setStage("summarizing");

    try {
      const result = await summarizeDocument(text, length);
      setSummary(result.summary);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the summary."
      );
    } finally {
      setStage("idle");
    }
  };

  const removeFile = () => {
    setFile(null);
    setText("");
    setSummary("");
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const words = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  const fileSize = file
    ? (file.size / 1024 / 1024).toFixed(2)
    : "0";

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">

          <div className="brand">
            <div className="brand-icon">✦</div>

            <div>
              <h2>DocuMind</h2>
              <span>AI Document Assistant</span>
            </div>
          </div>

          <div className="header-status">
            <span className="status-dot"></span>
            AI Ready
          </div>

        </div>
      </header>


      {/* MAIN */}
      <main className="container">

        {/* HERO */}
        <section className="hero">

          <div className="hero-badge">
            <span>✦</span>
            AI-POWERED DOCUMENT INTELLIGENCE
          </div>

          <h1>
            Understand your documents
            <span> in seconds.</span>
          </h1>

          <p>
            Upload a PDF or scanned image. DocuMind extracts the
            content and turns it into a clear, concise AI summary.
          </p>

        </section>


        {/* UPLOAD AREA */}
        <section
          className={`upload-box ${dragging ? "dragging" : ""} ${
            file ? "has-file" : ""
          }`}
          onDragOver={(event) => {
            event.preventDefault();

            if (!busy) {
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            hidden
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];

              if (selectedFile) {
                handleFile(selectedFile);
              }
            }}
          />


          {!file ? (
            <>

              <div className="upload-icon">
                ↑
              </div>

              <h2>Drop your document here</h2>

              <p>
                or choose a file from your computer
              </p>

              <button
                className="primary-button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                Choose File
              </button>

              <div className="upload-info">
                PDF · JPG · PNG · WEBP
                <span>•</span>
                Maximum 10 MB
              </div>

            </>
          ) : (

            <div className="file-preview">

              <div className="file-icon">
                📄
              </div>

              <div className="file-details">

                <strong>{file.name}</strong>

                <span>
                  {fileSize} MB
                </span>

              </div>

              <div className="file-actions">

                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </button>

                <button
                  className="remove-button"
                  disabled={busy}
                  onClick={removeFile}
                >
                  ×
                </button>

              </div>

            </div>

          )}

        </section>


        {/* PROCESSING */}
        {busy && (
          <div className="processing">

            <div className="spinner"></div>

            <div>
              <strong>
                {stage === "extracting"
                  ? "Extracting document..."
                  : "Generating your summary..."}
              </strong>

              <p>
                {stage === "extracting"
                  ? "Reading your document and extracting the content."
                  : "Analyzing the extracted content with AI."}
              </p>
            </div>

          </div>
        )}


        {/* ERROR */}
        {error && (
          <div className="error-box">
            <span>!</span>
            {error}
          </div>
        )}


        {/* EXTRACTED TEXT */}
        {text && (
          <section className="content-card">

            <div className="section-header">

              <div>
                <div className="section-title">
                  <span className="section-number">01</span>
                  Extracted Text
                </div>

                <p>
                  Content successfully extracted from your document.
                </p>
              </div>

              <div className="success-badge">
                ✓ Extracted
              </div>

            </div>


            <div className="stats">

              <div>
                <strong>{words.toLocaleString()}</strong>
                <span>Words</span>
              </div>

              <div>
                <strong>{text.length.toLocaleString()}</strong>
                <span>Characters</span>
              </div>

            </div>


            <div className="text-box">
              {text}
            </div>

          </section>
        )}


        {/* SUMMARY CONTROLS */}
        {text && (
          <section className="content-card">

            <div className="section-header">

              <div>
                <div className="section-title">
                  <span className="section-number">02</span>
                  Generate Summary
                </div>

                <p>
                  Choose how detailed you want your summary to be.
                </p>
              </div>

            </div>


            <div className="length-options">

              <button
                className={length === "short" ? "length-card active" : "length-card"}
                disabled={busy}
                onClick={() => setLength("short")}
              >
                <div className="length-icon">⚡</div>

                <div>
                  <strong>Short</strong>
                  <span>Quick overview</span>
                </div>

              </button>


              <button
                className={length === "medium" ? "length-card active" : "length-card"}
                disabled={busy}
                onClick={() => setLength("medium")}
              >
                <div className="length-icon">◈</div>

                <div>
                  <strong>Medium</strong>
                  <span>Balanced detail</span>
                </div>

              </button>


              <button
                className={length === "long" ? "length-card active" : "length-card"}
                disabled={busy}
                onClick={() => setLength("long")}
              >
                <div className="length-icon">✦</div>

                <div>
                  <strong>Long</strong>
                  <span>Detailed analysis</span>
                </div>

              </button>

            </div>


            <button
              className="generate-button"
              disabled={busy}
              onClick={handleSummarize}
            >

              {stage === "summarizing" ? (
                <>
                  <span className="button-spinner"></span>
                  Generating Summary...
                </>
              ) : (
                <>
                  ✦ Generate AI Summary
                </>
              )}

            </button>

          </section>
        )}


        {/* SUMMARY */}
        {summary && (
          <section className="summary-card">

            <div className="summary-header">

              <div className="summary-title">

                <div className="summary-icon">
                  ✦
                </div>

                <div>
                  <h2>AI Summary</h2>

                  <span>
                    {length.charAt(0).toUpperCase() + length.slice(1)} summary
                  </span>
                </div>

              </div>

              <div className="ai-badge">
                AI GENERATED
              </div>

            </div>


            <div className="summary-content">
              {summary}
            </div>

          </section>
        )}

      </main>


      {/* FOOTER */}
      <footer>
        <p>
          DocuMind · Documents in, clarity out.
        </p>

        <span>
          Powered by Gemini
        </span>
      </footer>

    </div>
  );
}

export default App;