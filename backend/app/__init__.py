"""
Chemistry Lab Data Management Application.

A FastAPI application for managing chemistry research data including
catalysts, samples, characterizations, experiments, and more.

Package Structure:
-----------------
- database.py: Database connection and session management
- main.py: FastAPI application entry point
- models/: SQLAlchemy ORM models
- schemas/: Pydantic validation schemas
- routers/: FastAPI route handlers

Quick Start:
-----------
    from app.main import app
    
    # Run with uvicorn
    uvicorn app.main:app --reload
"""

__version__ = "0.2.0"
