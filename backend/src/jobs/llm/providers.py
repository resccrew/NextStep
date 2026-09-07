import json
import requests
import anthropic
from .base import LLMClient

class OllamaClient(LLMClient):
    def __init__(self, base_url: str, model: str):
        self.base_url = base_url
        self.model = model

    def complete(self, prompt: str, max_tokens: int = 500, temperature: float = 0.2) -> str:
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "format": "json",
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                },
            },
            timeout=90,
        )
        response.raise_for_status()
        return response.json()["response"]


class AnthropicClient(LLMClient):
    def __init__(self, api_key: str, model: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def complete(self, prompt: str, max_tokens: int = 500, temperature: float = 0.2) -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {"role": "User", "content": prompt}
            ],
        )
        return response.content[0].text