"""
Application configuration loaded from environment variables.

This module centralizes all configuration in one place, making it easy to:
- See all configuration options at a glance
- Validate that required variables are set
- Provide type conversion (strings from env vars to integers, booleans, etc.)
- Document what each configuration variable does

In production, you might use a more sophisticated configuration library
like pydantic-settings which provides validation and type conversion.
"""

import os
from typing import Optional


class Settings:
    """
    Application settings loaded from environment variables.
    
    All settings are loaded when this class is instantiated, typically
    at application startup. This allows failing fast if required variables
    are missing rather than discovering the problem later.
    """

    # Database configuration
    # These variables define how to connect to PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # Environment indicator (development, staging, production)
    # Different environments might have different behavior
    ENVIRONMENT: str = os.getenv("ENVIRONMENT")

    # Security configuration for JWT authentication
    # SECRET_KEY must be kept secret - anyone with this can forge tokens
    # Generate with: openssl rand -hex 32
    SECRET_KEY: str = os.getenv("SECRET_KEY")

    # Algorithm for encoding JWT tokens
    # HS256 is HMAC with SHA-256, a symmetric signing algorithm
    ALGORITHM: str = os.getenv("ALGORITHM")

    # How long access tokens remain valid (in minutes)
    # Shorter is more secure but requires more frequent re-authentication
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    )

    # Backend server configuration
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT"))

    # CORS configuration for frontend communication
    # In production, this should be your actual frontend domain
    CORS_ORIGINS: list = [os.getenv("REACT_APP_API_URL", "http://localhost:3000")]

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT.lower() == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"

    def validate(self) -> None:
        """
        Validate that all required configuration is present and valid.
        
        Call this at application startup to fail fast if configuration
        is missing or invalid. This is much better than discovering
        configuration problems when a user tries to use a feature.
        """
        if self.is_production:
            # In production, enforce stricter requirements
            if self.SECRET_KEY == "dev-secret-key-change-in-production":
                raise ValueError(
                    "SECRET_KEY must be changed in production! "
                    "Generate with: openssl rand -hex 32"
                )

            if not self.DATABASE_URL.startswith("postgresql://"):
                raise ValueError("DATABASE_URL must be a PostgreSQL connection string")


# Create a single instance of settings that the entire application uses
# This instance is created when this module is first imported
# All other modules import this instance, ensuring consistent configuration
settings = Settings()

# Validate configuration at import time
# If validation fails, the application won't start, which is good
# Better to fail at startup than to fail when a user tries to authenticate
settings.validate()