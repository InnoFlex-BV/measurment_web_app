"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base

# Import all routers
from app.routers.core import users_router
from app.routers.catalysts import (
    chemicals_router,
    methods_router,
    supports_router,
    catalysts_router
)

# Import all models so SQLAlchemy knows about them
from app.models.core import User
from app.models.catalysts import Chemical, Method, Support, Catalyst


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    print(f"Starting application in {settings.ENVIRONMENT} mode")
    yield
    print("Application shutdown")


# Create the FastAPI application instance
app = FastAPI(
    title="Laboratory Data Management System",
    description="API for managing chemistry laboratory catalyst research data",
    version="1.0.0",
    lifespan=lifespan
)


# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include all routers
# Core infrastructure
app.include_router(users_router)

# Catalyst domain
app.include_router(chemicals_router)
app.include_router(methods_router)
app.include_router(supports_router)
app.include_router(catalysts_router)


@app.get("/")
def read_root():
    """
    Root endpoint returning API information.
    """
    return {
        "message": "Laboratory Data Management System API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }
