"""
Backend FastAPI para Search OS
Expone las funcionalidades de Python (Tool 1 y Tool 2) como API REST
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import sys
from pathlib import Path

# Añadir search-os al path
search_os_path = Path(__file__).parent.parent / "search-os"
sys.path.insert(0, str(search_os_path / "src"))

from routers import tool1, tool2

app = FastAPI(
    title="Search OS API",
    description="API para Tool 1 (Discovery Engine) y Tool 2 (Data Viewer)",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Añadir los puertos que uses
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(tool1.router, prefix="/api/tool1", tags=["Tool 1 - Discovery Engine"])
app.include_router(tool2.router, prefix="/api/tool2", tags=["Tool 2 - Data Viewer"])


@app.get("/")
async def root():
    return {"message": "Search OS API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
