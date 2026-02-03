"""
LLM Factory Pattern para instanciar diferentes modelos según necesidad.

Permite seleccionar entre 4 tipos de modelos:
- instant: Groq (Llama-3-70B) - Respuestas rápidas
- batch: DeepInfra (Llama-3-70B) - Económico para lotes
- complex: OpenAI (GPT-4o) - Razonamiento complejo
- long_context: Google (Gemini-1.5-Pro) - Contexto largo
"""
from typing import Optional
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from shared.config import (
    GROQ_API_KEY,
    DEEPINFRA_API_KEY,
    OPENAI_API_KEY,
    GOOGLE_API_KEY
)


class LLMFactory:
    """Factory para crear instancias de modelos LLM según la selección del usuario."""

    # Mapeo de selecciones UI a nombres de modelos
    MODEL_MAPPING = {
        "instant": {
            "name": "Groq (Llama-3-70B)",
            "provider": "groq",
            "model": "llama-3-70b-8192",
            "temperature": 0.1
        },
        "batch": {
            "name": "DeepInfra (Llama-3-70B)",
            "provider": "deepinfra",
            "model": "meta-llama/Meta-Llama-3-70B-Instruct",
            "temperature": 0.1
        },
        "complex": {
            "name": "OpenAI (GPT-4o)",
            "provider": "openai",
            "model": "gpt-4o",
            "temperature": 0.2
        },
        "long_context": {
            "name": "Google (Gemini-2.5-Flash)",
            "provider": "google",
            "model": "models/gemini-2.5-flash",
            "temperature": 0.2
        }
    }

    @staticmethod
    def get_model(ui_selection: str, api_keys: Optional[dict] = None):
        """
        Crea una instancia del modelo LLM según la selección del usuario.

        Args:
            ui_selection: Selección del usuario. Puede ser:
                - "instant": Groq (Llama-3-70B) - Respuestas rápidas
                - "batch": DeepInfra (Llama-3-70B) - Económico para lotes
                - "complex": OpenAI (GPT-4o) - Razonamiento complejo
                - "long_context": Google (Gemini-1.5-Pro) - Contexto largo
            api_keys: Diccionario opcional con API keys. Si no se proporciona,
                     se usan las del config.py

        Returns:
            Instancia del modelo LLM (ChatGroq, ChatOpenAI, o ChatGoogleGenerativeAI)

        Raises:
            ValueError: Si la selección no es válida
            ValueError: Si falta la API key requerida
        """
        if ui_selection not in LLMFactory.MODEL_MAPPING:
            raise ValueError(
                f"Selección inválida: '{ui_selection}'. "
                f"Opciones válidas: {list(LLMFactory.MODEL_MAPPING.keys())}"
            )

        # Usar API keys proporcionadas o las del config
        if api_keys is None:
            api_keys = {
                'GROQ': GROQ_API_KEY,
                'DEEPINFRA': DEEPINFRA_API_KEY,
                'OPENAI': OPENAI_API_KEY,
                'GOOGLE': GOOGLE_API_KEY
            }

        model_config = LLMFactory.MODEL_MAPPING[ui_selection]

        if ui_selection == "instant":
            if not api_keys.get('GROQ'):
                raise ValueError("GROQ_API_KEY no está configurada en variables de entorno")
            return ChatGroq(
                model_name=model_config["model"],
                groq_api_key=api_keys['GROQ'],
                temperature=model_config["temperature"]
            )

        elif ui_selection == "batch":
            if not api_keys.get('DEEPINFRA'):
                raise ValueError("DEEPINFRA_API_KEY no está configurada en variables de entorno")
            return ChatOpenAI(
                model=model_config["model"],
                api_key=api_keys['DEEPINFRA'],
                base_url="https://api.deepinfra.com/v1/openai",
                temperature=model_config["temperature"]
            )

        elif ui_selection == "complex":
            if not api_keys.get('OPENAI'):
                raise ValueError("OPENAI_API_KEY no está configurada en variables de entorno")
            return ChatOpenAI(
                model=model_config["model"],
                api_key=api_keys['OPENAI'],
                temperature=model_config["temperature"]
            )

        elif ui_selection == "long_context":
            if not api_keys.get('GOOGLE'):
                raise ValueError("GOOGLE_API_KEY no está configurada en variables de entorno")
            return ChatGoogleGenerativeAI(
                model=model_config["model"],
                google_api_key=api_keys['GOOGLE'],
                temperature=model_config["temperature"]
            )

    @staticmethod
    def get_model_info(ui_selection: str) -> dict:
        """
        Obtiene información sobre un modelo sin instanciarlo.

        Args:
            ui_selection: Selección del usuario

        Returns:
            Diccionario con información del modelo (name, provider, model, temperature)
        """
        if ui_selection not in LLMFactory.MODEL_MAPPING:
            raise ValueError(
                f"Selección inválida: '{ui_selection}'. "
                f"Opciones válidas: {list(LLMFactory.MODEL_MAPPING.keys())}"
            )
        return LLMFactory.MODEL_MAPPING[ui_selection].copy()

    @staticmethod
    def list_available_models() -> list:
        """
        Lista todos los modelos disponibles.

        Returns:
            Lista de tuplas (key, name) para usar en selectboxes
        """
        return [
            (key, config["name"])
            for key, config in LLMFactory.MODEL_MAPPING.items()
        ]
