from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PediDrip API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Kubernetes / deployment health probe hits GET /health (no /api prefix).
@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/")
def root():
    return {"status": "ok", "app": "PediDrip", "note": "Calculator runs fully client-side."}


@app.get("/api/")
def api_root():
    return {"status": "ok", "app": "PediDrip"}


@app.get("/api/health")
def api_health():
    return {"status": "healthy"}
