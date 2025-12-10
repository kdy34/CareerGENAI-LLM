from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from .config import settings

def get_llm():
    provider = settings.LLM_PROVIDER.lower().strip()

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set")
        return ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.2,
        )

    if provider == "anthropic":
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is not set")
        return ChatAnthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.ANTHROPIC_MODEL,
            temperature=0.2,
        )

    if provider == "gemini":
        # LangChain Google GenAI connector expects GOOGLE_API_KEY
        if not settings.GOOGLE_API_KEY:
            raise ValueError("GOOGLE_API_KEY is not set")

        return ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.2,
        )

    raise ValueError(f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}")
