from django.conf import settings
from .providers import OllamaClient, AnthropicClient

_client_instance = None

def get_llm_client():
    global _client_instance
    if _client_instance is not None:
        return _client_instance

    if settings.LLM_PROVIDER == "ollama":
        _client_instance = OllamaClient(
            base_url = settings.OLLAMA_BASE_URL,
            model = settings.OLLAMA_MODEL,
        )

    elif settings.LLM_PROVIDER == "anthropic":
        _client_instance = AnthropicClient(
            api_key = settings.ANTHROPIC_API_KEY,
            model = settings.ANTHROPIC_MODEL,
        )

    else:
        raise ValueError(f"Unknown LLM_PROVIDER: {settings.LLM_PROVIDER}")

    return _client_instance