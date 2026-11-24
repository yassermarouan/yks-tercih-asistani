import os
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from backend.data_loader import DataLoader
from backend.model_service import ModelService
from backend.explanation_service import ExplanationService
from backend.advisor_service import AdvisorService

# Global service singletons
data_loader: Optional[DataLoader] = None
model_service: Optional[ModelService] = None
explanation_service: Optional[ExplanationService] = None
advisor_service: Optional[AdvisorService] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global data_loader, model_service, explanation_service, advisor_service
    print("[App Startup] Initializing YKS Tercih Asistanı backend services...")
    data_loader = DataLoader()
    model_service = ModelService()
    explanation_service = ExplanationService()
    advisor_service = AdvisorService(data_loader)
    print("[App Startup] All backend services initialized.")
    yield
    print("[App Shutdown] Cleaning up services...")


app = FastAPI(
    title="YKS Tercih Asistanı API",
    description="Turkish Undergraduate Programs & Explainable Closing-Rank Predictions",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for local Vite frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "programs_count": len(data_loader.programs_by_code) if data_loader else 0,
        "model_loaded": model_service.model is not None if model_service else False,
    }


@app.get("/api/programs")
def search_programs(
    q: str = Query("", description="Search term for university, program name or code"),
    score_type: str = Query("ALL", description="Score type: ALL, SAY, EA, SÖZ, DİL"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    if not data_loader:
        raise HTTPException(status_code=503, detail="Data loader not initialized")
    return data_loader.search_programs(query=q, score_type=score_type, page=page, page_size=page_size)


@app.get("/api/programs/{program_code}")
def get_program_detail(program_code: str):
    if not data_loader:
        raise HTTPException(status_code=503, detail="Data loader not initialized")
    prog = data_loader.get_program(program_code)
    if not prog:
        raise HTTPException(status_code=404, detail=f"Program '{program_code}' not found")
    return prog


@app.get("/api/programs/{program_code}/prediction")
def get_program_prediction(program_code: str):
    if not data_loader or not model_service:
        raise HTTPException(status_code=503, detail="Services not initialized")
    prog = data_loader.get_program(program_code)
    if not prog:
        raise HTTPException(status_code=404, detail=f"Program '{program_code}' not found")
    return model_service.get_prediction_and_shap(prog)


@app.post("/api/programs/{program_code}/explain")
def generate_program_explanation(program_code: str, payload: Optional[dict] = None):
    if not data_loader or not model_service or not explanation_service:
        raise HTTPException(status_code=503, detail="Services not initialized")
    prog = data_loader.get_program(program_code)
    if not prog:
        raise HTTPException(status_code=404, detail=f"Program '{program_code}' not found")

    student_rank = None
    if payload:
        raw_rank = payload.get("student_rank")
        if raw_rank is not None:
            try:
                student_rank = int(str(raw_rank).replace(".", "").replace(",", "").strip())
            except (ValueError, TypeError):
                student_rank = None

    pred_data = model_service.get_prediction_and_shap(prog)
    explanation_res = explanation_service.generate_explanation(prog, pred_data, student_rank)
    return explanation_res


@app.post("/api/programs/{program_code}/simulate")
def simulate_program_quota(program_code: str, payload: dict):
    if not data_loader or not model_service:
        raise HTTPException(status_code=503, detail="Services not initialized")
    prog = data_loader.get_program(program_code)
    if not prog:
        raise HTTPException(status_code=404, detail=f"Program '{program_code}' not found")

    simulated_quota = payload.get("simulated_quota")
    if not simulated_quota or int(simulated_quota) <= 0:
        raise HTTPException(status_code=400, detail="Geçerli bir simüle kontenjan girilmelidir.")

    student_rank = payload.get("student_rank")
    if student_rank is not None:
        try:
            student_rank = int(str(student_rank).replace(".", "").replace(",", "").strip())
        except (ValueError, TypeError):
            student_rank = None

    return model_service.simulate_prediction(prog, int(simulated_quota), student_rank)


@app.post("/api/programs/{program_code}/simulate/explain")
def generate_simulation_explanation(program_code: str, payload: dict):
    if not data_loader or not model_service or not explanation_service:
        raise HTTPException(status_code=503, detail="Services not initialized")
    prog = data_loader.get_program(program_code)
    if not prog:
        raise HTTPException(status_code=404, detail=f"Program '{program_code}' not found")

    simulated_quota = payload.get("simulated_quota")
    if not simulated_quota or int(simulated_quota) <= 0:
        raise HTTPException(status_code=400, detail="Geçerli bir simüle kontenjan girilmelidir.")

    student_rank = payload.get("student_rank")
    if student_rank is not None:
        try:
            student_rank = int(str(student_rank).replace(".", "").replace(",", "").strip())
        except (ValueError, TypeError):
            student_rank = None

    sim_data = model_service.simulate_prediction(prog, int(simulated_quota), student_rank)
    return explanation_service.generate_simulation_explanation(prog, sim_data, student_rank)


@app.get("/api/evaluation")
def get_evaluation_metrics():
    if not model_service:
        raise HTTPException(status_code=503, detail="Model service not initialized")
    eval_data = model_service.get_evaluation()
    if not eval_data:
        raise HTTPException(status_code=404, detail="Evaluation metrics not available")
    return eval_data


@app.get("/api/advisor/metadata")
def get_advisor_metadata():
    if not advisor_service:
        raise HTTPException(status_code=503, detail="Advisor service not initialized")
    return advisor_service.get_metadata()


@app.post("/api/advisor/recommend")
def recommend_programs(payload: dict):
    if not advisor_service:
        raise HTTPException(status_code=503, detail="Advisor service not initialized")
    return advisor_service.recommend(payload)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)
