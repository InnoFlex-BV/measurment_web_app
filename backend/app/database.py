"""
Database configuration and session management.

This module sets up the SQLAlchemy engine and session factory for connecting
to PostgreSQL. It provides the database session dependency that routes use
to interact with the database.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment variable
# This keeps credentials out of source code and allows easy configuration
# Format: postgresql://username:password@host:port/database
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://labuser:labpassword@postgres:5432/labdata" # TODO: move to secrets file (probably)
)

# Create the SQLAlchemy engine
# The engine manages database connections and connection pooling
# 
# pool_pre_ping=True makes SQLAlchemy verify connections are alive before using them
# This prevents errors from stale connections after database restarts
# 
# echo=False in production, but setting to True during development would log all SQL
# which is invaluable for understanding what SQLAlchemy is doing
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    # Uncomment the next line to see all generated SQL queries (useful for learning/debugging)
    # echo=True,
)

# Create a SessionLocal factory
# This factory produces new Session instances for database operations
# 
# autocommit=False means transactions must be explicitly committed
# This is safer because it prevents accidental commits
# 
# autoflush=False means objects aren't automatically flushed to the database
# You control when flushes happen by calling flush() or commit()
# 
# bind=engine connects sessions to our database engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the declarative base class
# All SQLAlchemy models will inherit from this
# The base class provides the machinery that makes the ORM work
# It tracks model classes and their table metadata
Base = declarative_base()


def get_db():
    """
    Database session dependency for FastAPI routes.
    
    This function is a dependency that routes can declare to get a database session.
    FastAPI's dependency injection system calls this function, yields the session to
    the route, and ensures the session is closed when the request completes.
    
    The try-finally pattern ensures the session is always closed, even if the route
    raises an exception. This prevents connection leaks.
    
    Usage in a route:
        @router.get("/experiments")
        def get_experiments(db: Session = Depends(get_db)):
            # db is a database session you can use for queries
            experiments = db.query(Experiment).all()
            return experiments
    
    Yields:
        Session: A SQLAlchemy database session
    """
    db = SessionLocal()
    try:
        # Yield the session to the route
        # The route executes with this session
        yield db
    finally:
        # After the route completes (successfully or with an error),
        # close the session to return the connection to the pool
        db.close()