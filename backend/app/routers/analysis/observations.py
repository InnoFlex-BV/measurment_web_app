"""
Observation API router.

Observations capture qualitative research notes with structured JSON data.
This router provides CRUD operations and relationship management with
special support for querying JSONB fields.

Endpoint Summary:
- GET    /api/observations/              List with filtering
- POST   /api/observations/              Create new observation
- GET    /api/observations/{id}          Get details
- PATCH  /api/observations/{id}          Update
- DELETE /api/observations/{id}          Delete
- POST   /api/observations/{id}/catalysts/{catalyst_id}    Link catalyst
- DELETE /api/observations/{id}/catalysts/{catalyst_id}    Unlink catalyst
- POST   /api/observations/{id}/samples/{sample_id}        Link sample
- DELETE /api/observations/{id}/samples/{sample_id}        Unlink sample
- POST   /api/observations/{id}/files/{file_id}            Link file
- DELETE /api/observations/{id}/files/{file_id}            Unlink file
- POST   /api/observations/{id}/users/{user_id}            Link user
- DELETE /api/observations/{id}/users/{user_id}            Unlink user
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.analysis.observation import Observation
from app.models.catalysts.catalyst import Catalyst
from app.models.catalysts.sample import Sample
from app.models.core.user import User
# File model will be imported in Phase 3
# from app.models.core.file import File
from app.schemas.analysis.observation import (
    ObservationCreate, ObservationUpdate, ObservationResponse
)

router = APIRouter(
    prefix="/api/observations",
    tags=["Observations"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[ObservationResponse])
def list_observations(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in objective and conclusions"),
        catalyst_id: Optional[int] = Query(None, description="Filter by catalyst"),
        sample_id: Optional[int] = Query(None, description="Filter by sample"),
        has_calcination: Optional[bool] = Query(None, description="Filter by calcination data presence"),
        include: Optional[str] = Query(
            None,
            description="Relationships: catalysts,samples,files,users"
        ),
        db: Session = Depends(get_db)
):
    """
    List observations with filtering and relationship inclusion.
    
    Filtering options:
    - search: Partial match in objective and conclusions text
    - catalyst_id: Only observations about a specific catalyst
    - sample_id: Only observations about a specific sample
    - has_calcination: True for those with calcination data, False for those without
    
    JSONB Field Querying:
    ---------------------
    For more advanced queries on the JSONB fields (conditions, data),
    consider using direct database queries. The API provides basic
    filtering; complex JSON queries should use the database directly
    or custom endpoints can be added.
    """

    query = db.query(Observation)

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Observation.objective.ilike(search_pattern)) |
            (Observation.conclusions.ilike(search_pattern)) |
            (Observation.observations_text.ilike(search_pattern))
        )

    if catalyst_id is not None:
        query = query.join(Observation.catalysts).filter(
            Catalyst.id == catalyst_id
        )

    if sample_id is not None:
        query = query.join(Observation.samples).filter(
            Sample.id == sample_id
        )

    if has_calcination is not None:
        if has_calcination:
            # JSONB not empty: {} is falsy, so check for non-empty
            query = query.filter(
                Observation.calcination_parameters != {}
            )
        else:
            query = query.filter(
                Observation.calcination_parameters == {}
            )

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalysts' in include_rels:
            query = query.options(joinedload(Observation.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Observation.samples))
        if 'files' in include_rels:
            query = query.options(joinedload(Observation.files))
        if 'users' in include_rels:
            query = query.options(joinedload(Observation.users))

    # Order by creation date
    query = query.order_by(Observation.created_at.desc())

    observations = query.offset(skip).limit(limit).all()
    return observations


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{observation_id}", response_model=ObservationResponse)
def get_observation(
        observation_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single observation by ID.
    """

    query = db.query(Observation)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalysts' in include_rels:
            query = query.options(joinedload(Observation.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Observation.samples))
        if 'files' in include_rels:
            query = query.options(joinedload(Observation.files))
        if 'users' in include_rels:
            query = query.options(joinedload(Observation.users))

    observation = query.filter(Observation.id == observation_id).first()

    if observation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation with ID {observation_id} not found"
        )

    return observation


@router.post("/", response_model=ObservationResponse,
             status_code=status.HTTP_201_CREATED)
def create_observation(
        observation: ObservationCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new observation with optional relationships.
    
    JSONB Field Guidelines:
    - conditions: Environmental/process conditions (temperature, pressure, etc.)
    - calcination_parameters: Heat treatment settings (empty {} if N/A)
    - data: Numerical measurements and categorical observations
    
    All JSONB fields accept arbitrary JSON objects. Use consistent key
    naming within your research group for best results.
    """

    # Create observation instance
    obs_data = observation.model_dump(exclude={
        'catalyst_ids', 'sample_ids', 'file_ids', 'user_ids'
    })
    db_obs = Observation(**obs_data)

    # Establish catalyst relationships
    if observation.catalyst_ids:
        catalysts = db.query(Catalyst).filter(
            Catalyst.id.in_(observation.catalyst_ids)
        ).all()
        found_ids = {c.id for c in catalysts}
        missing_ids = set(observation.catalyst_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Catalyst IDs not found: {sorted(missing_ids)}"
            )
        db_obs.catalysts = catalysts

    # Establish sample relationships
    if observation.sample_ids:
        samples = db.query(Sample).filter(
            Sample.id.in_(observation.sample_ids)
        ).all()
        found_ids = {s.id for s in samples}
        missing_ids = set(observation.sample_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample IDs not found: {sorted(missing_ids)}"
            )
        db_obs.samples = samples

    # Establish file relationships (Phase 3)
    # For now, accept but don't validate file IDs
    # TODO: Add file validation when File model is implemented
    if observation.file_ids:
        # files = db.query(File).filter(File.id.in_(observation.file_ids)).all()
        # db_obs.files = files
        pass  # Will be implemented in Phase 3

    # Establish user relationships
    if observation.user_ids:
        users = db.query(User).filter(
            User.id.in_(observation.user_ids)
        ).all()
        found_ids = {u.id for u in users}
        missing_ids = set(observation.user_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User IDs not found: {sorted(missing_ids)}"
            )
        db_obs.users = users

    db.add(db_obs)
    db.commit()
    db.refresh(db_obs)

    return db_obs


@router.patch("/{observation_id}", response_model=ObservationResponse)
def update_observation(
        observation_id: int,
        obs_update: ObservationUpdate,
        db: Session = Depends(get_db)
):
    """
    Update an observation with partial data.
    
    JSONB fields are replaced entirely when provided, not merged.
    To update a specific key in a JSONB field, fetch the current
    value, modify it, and send the complete updated object.
    """

    db_obs = db.query(Observation).filter(
        Observation.id == observation_id
    ).first()

    if db_obs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation with ID {observation_id} not found"
        )

    update_data = obs_update.model_dump(exclude_unset=True)

    # Handle relationship updates
    if 'catalyst_ids' in update_data:
        cat_ids = update_data.pop('catalyst_ids')
        if cat_ids is not None:
            catalysts = db.query(Catalyst).filter(
                Catalyst.id.in_(cat_ids)
            ).all()
            db_obs.catalysts = catalysts

    if 'sample_ids' in update_data:
        samp_ids = update_data.pop('sample_ids')
        if samp_ids is not None:
            samples = db.query(Sample).filter(
                Sample.id.in_(samp_ids)
            ).all()
            db_obs.samples = samples

    if 'file_ids' in update_data:
        file_ids_list = update_data.pop('file_ids')
        # TODO: Implement when File model is available
        pass

    if 'user_ids' in update_data:
        user_ids_list = update_data.pop('user_ids')
        if user_ids_list is not None:
            users = db.query(User).filter(
                User.id.in_(user_ids_list)
            ).all()
            db_obs.users = users

    # Update scalar and JSONB fields
    for field, value in update_data.items():
        setattr(db_obs, field, value)

    db.commit()
    db.refresh(db_obs)

    return db_obs


@router.delete("/{observation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observation(
        observation_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete an observation.
    
    This removes all links to catalysts, samples, files, and users
    through cascade delete on the junction tables.
    """

    db_obs = db.query(Observation).filter(
        Observation.id == observation_id
    ).first()

    if db_obs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation with ID {observation_id} not found"
        )

    db.delete(db_obs)
    db.commit()

    return None


# =============================================================================
# Relationship Management Endpoints
# =============================================================================

@router.post("/{observation_id}/catalysts/{catalyst_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_catalyst_to_observation(
        observation_id: int,
        catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Link a catalyst to this observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst {catalyst_id} not found"
        )

    if catalyst not in obs.catalysts:
        obs.catalysts.append(catalyst)
        db.commit()

    return None


@router.delete("/{observation_id}/catalysts/{catalyst_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_catalyst_from_observation(
        observation_id: int,
        catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a catalyst link from this observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst {catalyst_id} not found"
        )

    if catalyst in obs.catalysts:
        obs.catalysts.remove(catalyst)
        db.commit()

    return None


@router.post("/{observation_id}/samples/{sample_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_sample_to_observation(
        observation_id: int,
        sample_id: int,
        db: Session = Depends(get_db)
):
    """
    Link a sample to this observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    if sample not in obs.samples:
        obs.samples.append(sample)
        db.commit()

    return None


@router.delete("/{observation_id}/samples/{sample_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_sample_from_observation(
        observation_id: int,
        sample_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a sample link from this observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    if sample in obs.samples:
        obs.samples.remove(sample)
        db.commit()

    return None


@router.post("/{observation_id}/users/{user_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_user_to_observation(
        observation_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Record that a user made this observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    if user not in obs.users:
        obs.users.append(user)
        db.commit()

    return None


@router.delete("/{observation_id}/users/{user_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_observation(
        observation_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a user's association with this observation.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    if user in obs.users:
        obs.users.remove(user)
        db.commit()

    return None


# =============================================================================
# File Management Endpoints (Phase 3)
# =============================================================================
# These will be implemented when the File model is available

@router.post("/{observation_id}/files/{file_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_file_to_observation(
        observation_id: int,
        file_id: int,
        db: Session = Depends(get_db)
):
    """
    Attach a file to this observation.
    
    TODO: Implement when File model is available in Phase 3.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    # TODO: Implement file attachment
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="File attachment will be available in Phase 3"
    )


@router.delete("/{observation_id}/files/{file_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_file_from_observation(
        observation_id: int,
        file_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a file attachment from this observation.
    
    TODO: Implement when File model is available in Phase 3.
    """

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    # TODO: Implement file removal
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="File attachment will be available in Phase 3"
    )