const API_BASE = "http://127.0.0.1:8000";

export async function extractDocument(file) {
  const formData = new FormData();

  formData.append("file", file);

  let response;

  try {
    response = await fetch(`${API_BASE}/extract`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new Error(
      "Could not reach the backend. Make sure FastAPI is running."
    );
  }

  if (!response.ok) {
    throw new Error("Could not extract text from the document.");
  }

  const data = await response.json();

  if (!data.text || !data.text.trim()) {
    throw new Error("No readable text was found in this document.");
  }

  return data.text;
}


export async function summarizeDocument(text, length) {
  const url =
    `${API_BASE}/summarize` +
    `?text=${encodeURIComponent(text)}` +
    `&length=${encodeURIComponent(length)}`;

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
    });
  } catch (error) {
    throw new Error(
      "Could not reach the backend. Make sure FastAPI is running."
    );
  }

  if (!response.ok) {
    throw new Error("Could not generate the summary.");
  }

  const data = await response.json();

  if (!data.summary || !data.summary.trim()) {
    throw new Error("The summary came back empty.");
  }

  return data;
}