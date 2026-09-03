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


@app.get("/api/")
def root():
    return {"status": "ok", "app": "PediDrip", "note": "Calculator runs fully client-side."}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
