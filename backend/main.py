"""
Main FastAPI application entry point.

This module creates the FastAPI app instance, configures it, and includes
all the routers. It also sets up CORS middleware and database initialization.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import experiment_types, experiments, measurements

# Import all models so SQLAlchemy knows about them
# This is important for relationship resolution
from app.models import user, experiment_type, experiment, measurement, observation, file


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    
    This replaces the older @app.on_event decorators and provides
    better async support. Code before yield runs at startup,
    code after yield runs at shutdown.
    """
    # Startup: Create database tables if they don't exist
    # In production, you'd use Alembic migrations instead
    # Base.metadata.create_all(bind=engine)

    print("Application startup complete")
    yield
    # Shutdown: Clean up resources
    print("Application shutdown")


# Create the FastAPI application instance
app = FastAPI(
    title="Laboratory Data Management System",
    description="API for managing chemistry laboratory experiment data",
    version="1.0.0",
    lifespan=lifespan
)


# Configure CORS middleware
# CORS (Cross-Origin Resource Sharing) allows the React frontend
# running on localhost:3000 to make requests to this API on localhost:8000
app.add_middleware(
    CORSMiddleware,
    # In development, allow all origins. In production, specify exact origins
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    # Allow credentials (cookies, authorization headers)
    allow_credentials=True,
    # Allow all HTTP methods
    allow_methods=["*"],
    # Allow all headers
    allow_headers=["*"],
)


# Include routers
# Each router adds its endpoints to the application
app.include_router(experiment_types.router)
app.include_router(experiments.router)
app.include_router(measurements.router)


# Root endpoint for health checks
@app.get("/")
def read_root():
    """
    Root endpoint returning API information.
    
    This is useful for health checks and verifying the API is running.
    """
    return {
        "message": "Laboratory Data Management System API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns a simple response indicating the API is operational.
    In a real system, this might check database connectivity too.
    """
    return {"status": "healthy"}