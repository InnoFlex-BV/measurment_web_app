"""
Experiments domain routers.

API endpoints for experimental testing and data collection:
- Waveforms: Electrical waveform configurations
- Reactors: Reactor equipment
- Processed: Calculated experiment results
- Analyzers: FTIR and OES analyzer instruments (polymorphic)
- Experiments: Plasma, Photocatalysis, and Misc experiments (polymorphic)
"""

from app.routers.experiments.waveforms import router as waveforms_router
from app.routers.experiments.reactors import router as reactors_router
from app.routers.experiments.processed import router as processed_router
from app.routers.experiments.analyzers import router as analyzers_router
from app.routers.experiments.experiments import router as experiments_router

__all__ = [
    "waveforms_router",
    "reactors_router",
    "processed_router",
    "analyzers_router",
    "experiments_router",
]