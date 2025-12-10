import pdfplumber
from docx import Document
from fastapi import UploadFile
import io


async def extract_text_from_file(file: UploadFile) -> str:
    """
    Detects file type and extracts plain text.
    Supports:
    - PDF
    - DOCX
    - TXT
    """
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        return await extract_text_from_pdf(file)

    elif filename.endswith(".docx"):
        return await extract_text_from_docx(file)

    elif filename.endswith(".txt"):
        content = await file.read()
        return content.decode("utf-8", errors="ignore")

    else:
        raise ValueError("Unsupported file type. Upload PDF, DOCX or TXT.")


async def extract_text_from_pdf(file: UploadFile) -> str:
    content = await file.read()
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
    except Exception:
        text = ""
    return text


async def extract_text_from_docx(file: UploadFile) -> str:
    content = await file.read()
    text = ""
    try:
        doc = Document(io.BytesIO(content))
        for p in doc.paragraphs:
            text += p.text + "\n"
    except Exception:
        text = ""
    return text
