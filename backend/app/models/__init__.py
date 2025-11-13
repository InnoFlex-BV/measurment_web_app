"""
SQLAlchemy ORM models for the catalyst research database.

Models are organized into subdirectories by domain:
- catalysts: Catalyst synthesis and inventory management
- experiments: Experimental testing and data collection
- analysis: Characterizations and observations
- reference: Lookup tables and supporting data
- core: Infrastructure models (users, files)

Phase 1 implements the catalysts domain and core infrastructure.
Future phases will add experiments, analysis, and reference domains.
"""

# Import base first since all models need it
from app.database import Base

# Import from subdomains
# Each subdomain's __init__.py exports its models
from app.models.core import User
from app.models.catalysts import Chemical, Method, Support, Catalyst

# Export all models for convenient importing
# This allows: from app.models import User, Catalyst
__all__ = [
    "Base",
    # Core infrastructure
    "User",
    # Catalysts domain
    "Chemical",
    "Method",
    "Support",
    "Catalyst",
]
