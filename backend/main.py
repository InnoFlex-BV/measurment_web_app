"""
FastAPI application entry point.

This module creates and configures the FastAPI application instance,
registers all routers, and sets up middleware and exception handlers.

Running the Application:
-----------------------
Development:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Production:
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

With Docker:
    docker-compose up

API Documentation:
-----------------
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

# Import all routers
from app.routers import all_routers
from app.database import engine, Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# =============================================================================
# Application Lifespan
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events:
    - Startup: Database connection verification, table creation (dev only)
    - Shutdown: Cleanup resources
    """

    # Startup
    logger.info("Starting application...")

    # Verify database connection
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        logger.info("Database connection verified")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        # Don't raise - let the app start anyway for debugging

    # In development, you might want to create tables automatically
    # For production, use Alembic migrations instead
    # Base.metadata.create_all(bind=engine)

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down application...")


# =============================================================================
# Application Factory
# =============================================================================

def create_app() -> FastAPI:
    """
    Application factory function.
    
    Creates and configures the FastAPI application with:
    - Metadata (title, description, version)
    - CORS middleware
    - All domain routers
    - Exception handlers
    """

    app = FastAPI(
        title="Chemistry Lab Data Management API",
        description="""
## Overview

REST API for managing chemistry laboratory research data including:

- **Catalysts**: Synthesized catalyst materials and their properties
- **Samples**: Prepared portions of catalysts for testing
- **Methods**: Synthesis procedures and chemical requirements
- **Characterizations**: Analytical measurements (XRD, BET, TEM, etc.)
- **Observations**: Qualitative research notes
- **Experiments**: Performance testing (Phase 3)
- **Users**: Research personnel and audit tracking

## Authentication

Currently, the API does not require authentication. In production,
implement OAuth2 or API key authentication.

## Pagination

List endpoints support pagination via `skip` and `limit` query parameters:
- `skip`: Number of records to skip (default: 0)
- `limit`: Maximum records to return (default: 100, max: 1000)

## Relationship Loading

Many endpoints support an `include` query parameter to load related
entities in a single request, avoiding N+1 query problems:

```
GET /api/catalysts/1?include=method,samples,characterizations
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 204: No Content (successful delete)
- 400: Bad Request (validation error)
- 404: Not Found
- 500: Internal Server Error
        """,
        version="0.4.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        openapi_tags=[
            {"name": "Users", "description": "Research personnel management"},
            {"name": "Files", "description": "File metadata management"},
            {"name": "Audit", "description": "User contribution tracking"},
            {"name": "Catalysts", "description": "Catalyst materials"},
            {"name": "Samples", "description": "Prepared catalyst samples"},
            {"name": "Methods", "description": "Synthesis procedures"},
            {"name": "Chemicals", "description": "Chemical compounds"},
            {"name": "Supports", "description": "Substrate materials"},
            {"name": "Characterizations", "description": "Analytical measurements"},
            {"name": "Observations", "description": "Research notes"},
            {"name": "Waveforms", "description": "Electrical waveform configurations"},
            {"name": "Reactors", "description": "Reactor equipment"},
            {"name": "Processed Results", "description": "Calculated experiment results"},
            {"name": "Analyzers", "description": "FTIR and OES analyzer instruments"},
            {"name": "Experiments", "description": "Plasma, Photocatalysis, and Misc experiments"},
            {"name": "Contaminants", "description": "Target pollutant compounds"},
            {"name": "Carriers", "description": "Carrier/balance gases"},
            {"name": "Groups", "description": "Experiment groupings"},
        ]
    )

    # =========================================================================
    # CORS Middleware
    # =========================================================================

    # Configure CORS for frontend access
    # In production, restrict origins to your actual frontend domain
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://192.168.0.4:3000",
            "http://localhost:3000",      # react development server
            "http://localhost:5173",      # vite development server
            "http://localhost:8080",      # alternative port
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # =========================================================================
    # Register Routers
    # =========================================================================

    for router in all_routers:
        app.include_router(router)

    # =========================================================================
    # Root Endpoint
    # =========================================================================

    @app.get("/", tags=["Root"])
    async def root():
        """
        Root endpoint returning API information.
        """
        return {
            "name": "Chemistry Lab Data Management API",
            "version": "0.4.0",
            "status": "running",
            "documentation": "/docs",
            "endpoints": {
                "users": "/api/users",
                "files": "/api/files",
                "audit": "/api/audit",
                "catalysts": "/api/catalysts",
                "samples": "/api/samples",
                "methods": "/api/methods",
                "chemicals": "/api/chemicals",
                "supports": "/api/supports",
                "characterizations": "/api/characterizations",
                "observations": "/api/observations",
                "waveforms": "/api/waveforms",
                "reactors": "/api/reactors",
                "processed": "/api/processed",
                "analyzers": "/api/analyzers",
                "experiments": "/api/experiments",
                "contaminants": "/api/contaminants",
                "carriers": "/api/carriers",
                "groups": "/api/groups",
            }
        }

    @app.get("/health", tags=["Root"])
    async def health_check():
        """
        Health check endpoint for monitoring.
        """
        # Check database connectivity
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            db_status = "healthy"
        except Exception as e:
            db_status = f"unhealthy: {str(e)}"

        return {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "database": db_status
        }

    # =========================================================================
    # Exception Handlers
    # =========================================================================

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """
        Global exception handler for unhandled errors.
        
        Logs the error and returns a generic error response.
        In production, avoid exposing internal error details.
        """
        logger.error(f"Unhandled exception: {exc}", exc_info=True)

        return JSONResponse(
            status_code=500,
            content={
                "detail": "An internal error occurred. Please try again later.",
                # In development, include error details:
                # "debug": str(exc)
            }
        )

    return app


# =============================================================================
# Application Instance
# =============================================================================

app = create_app()


# =============================================================================
# Development Server
# =============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
