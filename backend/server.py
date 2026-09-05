from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PediDrip API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # A wildcard origin combined with credentials is rejected by every browser.
    # This API is public and stateless, so credentials are simply not allowed.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/")
def root():
    return {"status": "ok", "app": "PediDrip", "note": "Calculator runs fully client-side."}


@app.get("/api/health")
def health():
    return {"status": "healthy"}
