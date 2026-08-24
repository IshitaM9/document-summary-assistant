import os

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured")

client = genai.Client(api_key=api_key)


@app.get("/")
def root():
    return {
        "message": "Document Summary Assistant API is running"
    }


@app.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    prompt = """
Extract all readable text from this document.

Requirements:
- Preserve the natural reading order.
- Preserve headings where possible.
- Do not summarize.
- Do not add information.
- Return only the extracted text.
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[
            {
                "inline_data": {
                    "mime_type": file.content_type,
                    "data": contents,
                }
            },
            prompt,
        ],
    )

    return {
        "filename": file.filename,
        "text": response.text,
    }


@app.post("/summarize")
async def summarize_document(text: str, length: str = "medium"):
    length_instructions = {
        "short": "Write a very concise summary in 2-3 sentences.",
        "medium": "Write a balanced summary in 1-2 paragraphs.",
        "long": "Write a detailed summary covering all major ideas and important supporting details in 3-5 paragraphs.",
    }

    selected_instruction = length_instructions.get(
        length.lower(),
        length_instructions["medium"],
    )

    prompt = f"""
You are a document summarization assistant.

{selected_instruction}

Requirements:
- Capture the main ideas and important information.
- Do not invent or assume facts.
- Keep the summary clear and easy to read.
- Provide exactly 5 important key points.
- Use clear headings.
- If the document contains claims, opinions, or conflicting viewpoints,
  preserve that distinction.
- Do not mention that you are an AI.

Document:

{text}
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )

    return {
        "length": length,
        "summary": response.text,
    }