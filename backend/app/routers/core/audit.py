"""
Audit API router.

Provides endpoints for viewing user contributions and activity across
all entity types. This router aggregates information from the various
user junction tables (user_catalyst, user_sample, etc.) to provide
comprehensive audit trail views.

Endpoint Summary:
- GET    /api/audit/users/{user_id}/activity    Get user's activity summary
- GET    /api/audit/users/{user_id}/catalysts   Get user's catalyst contributions
- GET    /api/audit/users/{user_id}/samples     Get user's sample contributions
- GET    /api/audit/users/{user_id}/characterizations  Get user's characterizations
- GET    /api/audit/users/{user_id}/observations       Get user's observations
- GET    /api/audit/users/{user_id}/experiments        Get user's experiments
- GET    /api/audit/catalysts/{id}/contributors  Get catalyst contributors
- GET    /api/audit/samples/{id}/contributors    Get sample contributors
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.core.user import User
from app.models.catalysts.catalyst import Catalyst, user_catalyst
from app.models.catalysts.sample import Sample, user_sample
from app.models.analysis.characterization import Characterization, user_characterization
from app.models.analysis.observation import Observation, user_observation
from app.models.experiments.experiment import Experiment, user_experiment
from app.models.catalysts.method import UserMethod
from app.schemas.core.audit import (
    UserActivitySummary,
    EntityContributors,
    UserContributionResponse
)

router = APIRouter(
    prefix="/api/audit",
    tags=["Audit"]
)


# =============================================================================
# User Activity Endpoints
# =============================================================================

@router.get("/users/{user_id}/activity", response_model=UserActivitySummary)
def get_user_activity_summary(
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Get a summary of all contributions by a user across all entity types.
    """

    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Count contributions in each junction table
    catalysts_count = db.execute(
        select(func.count()).select_from(user_catalyst).where(
            user_catalyst.c.user_id == user_id
        )
    ).scalar() or 0

    samples_count = db.execute(
        select(func.count()).select_from(user_sample).where(
            user_sample.c.user_id == user_id
        )
    ).scalar() or 0

    characterizations_count = db.execute(
        select(func.count()).select_from(user_characterization).where(
            user_characterization.c.user_id == user_id
        )
    ).scalar() or 0

    observations_count = db.execute(
        select(func.count()).select_from(user_observation).where(
            user_observation.c.user_id == user_id
        )
    ).scalar() or 0

    experiments_count = db.execute(
        select(func.count()).select_from(user_experiment).where(
            user_experiment.c.user_id == user_id
        )
    ).scalar() or 0

    method_changes_count = db.query(UserMethod).filter(
        UserMethod.user_id == user_id
    ).count()

    total = (catalysts_count + samples_count + characterizations_count +
             observations_count + experiments_count + method_changes_count)

    # Find most recent activity across all tables
    # This is a bit complex, so we'll check each table's max timestamp
    timestamps = []

    result = db.execute(
        select(func.max(user_catalyst.c.changed_at)).where(
            user_catalyst.c.user_id == user_id
        )
    ).scalar()
    if result:
        timestamps.append(result)

    result = db.execute(
        select(func.max(user_sample.c.changed_at)).where(
            user_sample.c.user_id == user_id
        )
    ).scalar()
    if result:
        timestamps.append(result)

    result = db.execute(
        select(func.max(user_characterization.c.changed_at)).where(
            user_characterization.c.user_id == user_id
        )
    ).scalar()
    if result:
        timestamps.append(result)

    result = db.execute(
        select(func.max(user_observation.c.changed_at)).where(
            user_observation.c.user_id == user_id
        )
    ).scalar()
    if result:
        timestamps.append(result)

    result = db.execute(
        select(func.max(user_experiment.c.changed_at)).where(
            user_experiment.c.user_id == user_id
        )
    ).scalar()
    if result:
        timestamps.append(result)

    last_method = db.query(func.max(UserMethod.changed_at)).filter(
        UserMethod.user_id == user_id
    ).scalar()
    if last_method:
        timestamps.append(last_method)

    last_activity = max(timestamps) if timestamps else None

    return UserActivitySummary(
        user_id=user_id,
        catalysts_count=catalysts_count,
        samples_count=samples_count,
        characterizations_count=characterizations_count,
        observations_count=observations_count,
        experiments_count=experiments_count,
        method_changes_count=method_changes_count,
        total_contributions=total,
        last_activity=last_activity
    )


@router.get("/users/{user_id}/catalysts")
def get_user_catalyst_contributions(
        user_id: int,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db)
):
    """
    Get all catalysts a user has contributed to.
    """

    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Query junction table with catalyst details
    results = db.execute(
        select(
            user_catalyst.c.catalyst_id,
            user_catalyst.c.changed_at,
            Catalyst.descriptive_name
        ).select_from(user_catalyst).join(
            Catalyst, user_catalyst.c.catalyst_id == Catalyst.id
        ).where(
            user_catalyst.c.user_id == user_id
        ).order_by(
            user_catalyst.c.changed_at.desc()
        ).offset(skip).limit(limit)
    ).all()

    return [
        {
            "catalyst_id": r.catalyst_id,
            "catalyst_name": r.descriptive_name,
            "changed_at": r.changed_at
        }
        for r in results
    ]


@router.get("/users/{user_id}/samples")
def get_user_sample_contributions(
        user_id: int,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db)
):
    """
    Get all samples a user has contributed to.
    """

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    results = db.execute(
        select(
            user_sample.c.sample_id,
            user_sample.c.changed_at,
            Sample.name
        ).select_from(user_sample).join(
            Sample, user_sample.c.sample_id == Sample.id
        ).where(
            user_sample.c.user_id == user_id
        ).order_by(
            user_sample.c.changed_at.desc()
        ).offset(skip).limit(limit)
    ).all()

    return [
        {
            "sample_id": r.sample_id,
            "sample_name": r.name,
            "changed_at": r.changed_at
        }
        for r in results
    ]


@router.get("/users/{user_id}/characterizations")
def get_user_characterization_contributions(
        user_id: int,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db)
):
    """
    Get all characterizations a user has performed.
    """

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    results = db.execute(
        select(
            user_characterization.c.characterization_id,
            user_characterization.c.changed_at,
            Characterization.type_name
        ).select_from(user_characterization).join(
            Characterization,
            user_characterization.c.characterization_id == Characterization.id
        ).where(
            user_characterization.c.user_id == user_id
        ).order_by(
            user_characterization.c.changed_at.desc()
        ).offset(skip).limit(limit)
    ).all()

    return [
        {
            "characterization_id": r.characterization_id,
            "type_name": r.type_name,
            "changed_at": r.changed_at
        }
        for r in results
    ]


@router.get("/users/{user_id}/observations")
def get_user_observation_contributions(
        user_id: int,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db)
):
    """
    Get all observations a user has recorded.
    """

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    results = db.execute(
        select(
            user_observation.c.observation_id,
            user_observation.c.changed_at,
            Observation.objective
        ).select_from(user_observation).join(
            Observation,
            user_observation.c.observation_id == Observation.id
        ).where(
            user_observation.c.user_id == user_id
        ).order_by(
            user_observation.c.changed_at.desc()
        ).offset(skip).limit(limit)
    ).all()

    return [
        {
            "observation_id": r.observation_id,
            "objective": r.objective,
            "changed_at": r.changed_at
        }
        for r in results
    ]


@router.get("/users/{user_id}/experiments")
def get_user_experiment_contributions(
        user_id: int,
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=500),
        db: Session = Depends(get_db)
):
    """
    Get all experiments a user has participated in.
    """

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    results = db.execute(
        select(
            user_experiment.c.experiment_id,
            user_experiment.c.changed_at,
            Experiment.name,
            Experiment.experiment_type
        ).select_from(user_experiment).join(
            Experiment,
            user_experiment.c.experiment_id == Experiment.id
        ).where(
            user_experiment.c.user_id == user_id
        ).order_by(
            user_experiment.c.changed_at.desc()
        ).offset(skip).limit(limit)
    ).all()

    return [
        {
            "experiment_id": r.experiment_id,
            "experiment_name": r.name,
            "experiment_type": r.experiment_type,
            "changed_at": r.changed_at
        }
        for r in results
    ]


# =============================================================================
# Entity Contributors Endpoints
# =============================================================================

@router.get("/catalysts/{catalyst_id}/contributors")
def get_catalyst_contributors(
        catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all users who have contributed to a catalyst.
    """

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    results = db.execute(
        select(
            user_catalyst.c.user_id,
            user_catalyst.c.changed_at,
            User.username,
            User.full_name
        ).select_from(user_catalyst).join(
            User, user_catalyst.c.user_id == User.id
        ).where(
            user_catalyst.c.catalyst_id == catalyst_id
        ).order_by(
            user_catalyst.c.changed_at.desc()
        )
    ).all()

    return {
        "entity_type": "catalyst",
        "entity_id": catalyst_id,
        "entity_name": catalyst.descriptive_name,
        "contributors": [
            {
                "user_id": r.user_id,
                "username": r.username,
                "full_name": r.full_name,
                "changed_at": r.changed_at
            }
            for r in results
        ],
        "total_contributors": len(results)
    }


@router.get("/samples/{sample_id}/contributors")
def get_sample_contributors(
        sample_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all users who have contributed to a sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    results = db.execute(
        select(
            user_sample.c.user_id,
            user_sample.c.changed_at,
            User.username,
            User.full_name
        ).select_from(user_sample).join(
            User, user_sample.c.user_id == User.id
        ).where(
            user_sample.c.sample_id == sample_id
        ).order_by(
            user_sample.c.changed_at.desc()
        )
    ).all()

    return {
        "entity_type": "sample",
        "entity_id": sample_id,
        "entity_name": sample.name,
        "contributors": [
            {
                "user_id": r.user_id,
                "username": r.username,
                "full_name": r.full_name,
                "changed_at": r.changed_at
            }
            for r in results
        ],
        "total_contributors": len(results)
    }


@router.get("/characterizations/{characterization_id}/contributors")
def get_characterization_contributors(
        characterization_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all users who have contributed to a characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization with ID {characterization_id} not found"
        )

    results = db.execute(
        select(
            user_characterization.c.user_id,
            user_characterization.c.changed_at,
            User.username,
            User.full_name
        ).select_from(user_characterization).join(
            User, user_characterization.c.user_id == User.id
        ).where(
            user_characterization.c.characterization_id == characterization_id
        ).order_by(
            user_characterization.c.changed_at.desc()
        )
    ).all()

    return {
        "entity_type": "characterization",
        "entity_id": characterization_id,
        "entity_name": char.type_name,
        "contributors": [
            {
                "user_id": r.user_id,
                "username": r.username,
                "full_name": r.full_name,
                "changed_at": r.changed_at
            }
            for r in results
        ],
        "total_contributors": len(results)
    }


@router.get("/observations/{observation_id}/contributors")
def get_observation_contributors(
        observation_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all users who have contributed to an observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation with ID {observation_id} not found"
        )

    results = db.execute(
        select(
            user_observation.c.user_id,
            user_observation.c.changed_at,
            User.username,
            User.full_name
        ).select_from(user_observation).join(
            User, user_observation.c.user_id == User.id
        ).where(
            user_observation.c.observation_id == observation_id
        ).order_by(
            user_observation.c.changed_at.desc()
        )
    ).all()

    return {
        "entity_type": "observation",
        "entity_id": observation_id,
        "entity_name": obs.objective,
        "contributors": [
            {
                "user_id": r.user_id,
                "username": r.username,
                "full_name": r.full_name,
                "changed_at": r.changed_at
            }
            for r in results
        ],
        "total_contributors": len(results)
    }


@router.get("/experiments/{experiment_id}/contributors")
def get_experiment_contributors(
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Get all users who have contributed to an experiment.
    """

    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    results = db.execute(
        select(
            user_experiment.c.user_id,
            user_experiment.c.changed_at,
            User.username,
            User.full_name
        ).select_from(user_experiment).join(
            User, user_experiment.c.user_id == User.id
        ).where(
            user_experiment.c.experiment_id == experiment_id
        ).order_by(
            user_experiment.c.changed_at.desc()
        )
    ).all()

    return {
        "entity_type": "experiment",
        "entity_id": experiment_id,
        "entity_name": exp.name,
        "contributors": [
            {
                "user_id": r.user_id,
                "username": r.username,
                "full_name": r.full_name,
                "changed_at": r.changed_at
            }
            for r in results
        ],
        "total_contributors": len(results)
    }