"""
Database connection and session management.

This module configures SQLAlchemy to connect to PostgreSQL and provides
the session dependency for FastAPI endpoints. The configuration supports
both local development and Docker deployment through environment variables.

Key Components:
- Engine: Manages the connection pool to PostgreSQL
- SessionLocal: Factory for creating database sessions
- Base: Declarative base for all ORM models
- get_db: FastAPI dependency that provides sessions with proper cleanup

Environment Variables:
- DATABASE_URL: Full connection string (preferred for production)
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Individual components

Connection Pool Settings:
- pool_size: Number of connections to keep open (default: 5)
- max_overflow: Additional connections allowed during peak load (default: 10)
- pool_pre_ping: Test connections before use to handle stale connections
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator


def get_database_url() -> str:
    """
    Construct database URL from environment variables.
    
    Supports two configuration methods:
    1. DATABASE_URL: Complete connection string (takes precedence)
    2. Individual variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
    
    Defaults are provided for local development with Docker Compose.
    """

    # Check for complete URL first (production/deployment)
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    # Fall back to individual components (development)
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "measurement_db")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "postgres")

    return f"postgresql://{user}:{password}@{host}:{port}/{name}"


# Database URL
DATABASE_URL = get_database_url()

# SQLAlchemy engine with connection pool configuration
# pool_pre_ping helps recover from database restarts
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"  # SQL logging for debug
)

# Session factory
# autocommit=False: Explicit transaction control
# autoflush=False: Manual flush for better control over when changes are sent
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base for ORM models
# All models inherit from this base
Base = declarative_base()


def get_db() -> Generator:
    """
    FastAPI dependency that provides database sessions.
    
    Usage in endpoints:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    
    The session is automatically closed after the request completes,
    even if an exception occurs. This prevents connection leaks.
    
    Yields:
        Session: SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables.
    
    Creates all tables defined in the ORM models. This is typically
    only used for development or testing. In production, use Alembic
    migrations for schema management.
    
    Note: This requires all models to be imported before calling,
    so that Base.metadata contains all table definitions.
    """
    # Import all models to register them with Base.metadata
    # This ensures all tables are created
    from app.models.core.user import User
    from app.models.catalysts.chemical import Chemical
    from app.models.catalysts.method import Method, UserMethod
    from app.models.catalysts.support import Support
    from app.models.catalysts.catalyst import Catalyst
    from app.models.catalysts.sample import Sample
    from app.models.analysis.characterization import Characterization
    from app.models.analysis.observation import Observation
    # Phase 3 models will be added here

    Base.metadata.create_all(bind=engine)
