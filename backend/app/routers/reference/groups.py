"""
Group API router.

Groups allow organizing experiments into logical collections for
comparison and analysis. A group might represent a parameter study,
a catalyst comparison, or experiments for a specific publication.

Endpoint Summary:
- GET    /api/groups/                        List groups
- POST   /api/groups/                        Create new group
- GET    /api/groups/{id}                    Get group details
- PATCH  /api/groups/{id}                    Update group
- DELETE /api/groups/{id}                    Delete group
- POST   /api/groups/{id}/experiments/{exp_id}   Add experiment
- DELETE /api/groups/{id}/experiments/{exp_id}   Remove experiment
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.reference.group import Group
from app.models.experiments.experiment import Experiment
from app.models.core.file import File
from app.schemas.reference.group import (
    GroupCreate, GroupUpdate, GroupResponse
)

router = APIRouter(
    prefix="/api/groups",
    tags=["Groups"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[GroupResponse])
def list_groups(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in name and purpose"),
        has_conclusion: Optional[bool] = Query(None, description="Filter by conclusion status"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: experiments,discussed_in_file"
        ),
        db: Session = Depends(get_db)
):
    """
    List groups with optional filtering.
    """

    query = db.query(Group)

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Group.name.ilike(search_pattern)) |
            (Group.purpose.ilike(search_pattern))
        )

    if has_conclusion is not None:
        if has_conclusion:
            query = query.filter(Group.conclusion.isnot(None))
        else:
            query = query.filter(Group.conclusion.is_(None))

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Group.experiments))
        if 'discussed_in_file' in include_rels:
            query = query.options(joinedload(Group.discussed_in_file))

    # Order by name
    query = query.order_by(Group.name)

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{group_id}", response_model=GroupResponse)
def get_group(
        group_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single group by ID.
    """

    query = db.query(Group)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'experiments' in include_rels:
            query = query.options(joinedload(Group.experiments))
        if 'discussed_in_file' in include_rels:
            query = query.options(joinedload(Group.discussed_in_file))

    group = query.filter(Group.id == group_id).first()

    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    return group


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
        group: GroupCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new group.
    
    Optionally include experiment_ids to add experiments on creation.
    """

    data = group.model_dump()
    experiment_ids = data.pop('experiment_ids', None)

    # Validate file reference
    if data.get('discussed_in_id'):
        file = db.query(File).filter(File.id == data['discussed_in_id']).first()
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File with ID {data['discussed_in_id']} not found"
            )

    db_group = Group(**data)

    # Handle experiments
    if experiment_ids:
        experiments = db.query(Experiment).filter(Experiment.id.in_(experiment_ids)).all()
        if len(experiments) != len(experiment_ids):
            found_ids = {e.id for e in experiments}
            missing = set(experiment_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Experiments not found: {missing}"
            )
        db_group.experiments = experiments

    db.add(db_group)

    try:
        db.commit()
        db.refresh(db_group)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_group


@router.patch("/{group_id}", response_model=GroupResponse)
def update_group(
        group_id: int,
        group_update: GroupUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a group.
    """

    db_group = db.query(Group).filter(Group.id == group_id).first()

    if db_group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    data = group_update.model_dump(exclude_unset=True)
    experiment_ids = data.pop('experiment_ids', None)

    # Validate file reference
    if 'discussed_in_id' in data and data['discussed_in_id']:
        file = db.query(File).filter(File.id == data['discussed_in_id']).first()
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File with ID {data['discussed_in_id']} not found"
            )

    # Update scalar fields
    for field, value in data.items():
        setattr(db_group, field, value)

    # Handle experiments if provided
    if experiment_ids is not None:
        experiments = db.query(Experiment).filter(Experiment.id.in_(experiment_ids)).all()
        if len(experiments) != len(experiment_ids):
            found_ids = {e.id for e in experiments}
            missing = set(experiment_ids) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Experiments not found: {missing}"
            )
        db_group.experiments = experiments

    db.commit()
    db.refresh(db_group)

    return db_group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(
        group_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a group.
    
    Note: This only deletes the group, not the experiments in it.
    The junction table entries are removed via CASCADE.
    """

    db_group = db.query(Group).filter(Group.id == group_id).first()

    if db_group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    db.delete(db_group)
    db.commit()

    return None


# =============================================================================
# Experiment Management Endpoints
# =============================================================================

@router.post("/{group_id}/experiments/{experiment_id}", status_code=status.HTTP_201_CREATED)
def add_experiment_to_group(
        group_id: int,
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Add an experiment to a group.
    """

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    if experiment in group.experiments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Experiment already in this group"
        )

    group.experiments.append(experiment)
    db.commit()

    return {"message": f"Experiment {experiment_id} added to group {group_id}"}


@router.delete("/{group_id}/experiments/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_experiment_from_group(
        group_id: int,
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove an experiment from a group.
    """

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    if experiment not in group.experiments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Experiment not in this group"
        )

    group.experiments.remove(experiment)
    db.commit()

    return None