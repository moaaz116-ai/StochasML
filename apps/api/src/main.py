from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
import logging
from src.config import settings

# Configure standard logger
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

from src.presentation.routes import projects, datasets, training, models, deployments
from src.domain.exceptions import DomainException

def create_app() -> FastAPI:
    app = FastAPI(
        title="Stochas ML API",
        description="Backend for the Stochas ML TinyML Platform",
        version=settings.api_version,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainException)
    async def domain_exception_handler(request: Request, exc: DomainException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message, "details": exc.details},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"error": "Validation Error", "details": exc.errors()},
        )

    @app.get("/api/v1/health")
    async def health_check():
        return {
            "status": "healthy", 
            "version": settings.api_version,
            "execution_mode": settings.ml_execution_mode
        }

    app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
    app.include_router(datasets.router, prefix="/api/v1/datasets", tags=["datasets"])
    app.include_router(training.router, prefix="/api/v1/training", tags=["training"])
    app.include_router(models.router, prefix="/api/v1/models", tags=["models"])
    app.include_router(deployments.router, prefix="/api/v1/deployments", tags=["deployments"])

    return app

app = create_app()
