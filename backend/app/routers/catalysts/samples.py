"""
Sample API router.

Samples are prepared portions of catalysts for testing in experiments and
characterization studies. This router provides CRUD operations plus
relationship management for linking samples to catalysts, supports, methods,
characterizations, observations, experiments, and users.

Key Features:
- Full CRUD operations with validation
- Filtering by catalyst, support, method, and depletion status
- Include parameter for loading related entities
- Material consumption tracking endpoint
- Relationship management via parent-style endpoints

Endpoint Summary:
- GET    /api/samples/              List samples with filtering
- POST   /api/samples/              Create new sample
- GET    /api/samples/{id}          Get sample details
- PATCH  /api/samples/{id}          Update sample
- DELETE /api/samples/{id}          Delete sample
- PATCH  /api/samples/{id}/consume  Consume material from sample
- POST   /api/samples/{id}/characterizations  Add characterization link
- POST   /api/samples/{id}/observations       Add observation link
- POST   /api/samples/{id}/users              Add user link
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models.catalysts.sample import Sample
from app.models.catalysts.catalyst import Catalyst
from app.models.catalysts.support import Support
from app.models.catalysts.method import Method
from app.models.analysis.characterization import Characterization
from app.models.analysis.observation import Observation
from app.models.core.user import User
from app.schemas.catalysts.sample import (
    SampleCreate, SampleUpdate, SampleResponse
)

router = APIRouter(
    prefix="/api/samples",
    tags=["Samples"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[SampleResponse])
def list_samples(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in sample names"),
        catalyst_id: Optional[int] = Query(None, description="Filter by source catalyst"),
        support_id: Optional[int] = Query(None, description="Filter by support material"),
        method_id: Optional[int] = Query(None, description="Filter by preparation method"),
        depleted: Optional[bool] = Query(None, description="Filter by depletion status"),
        include: Optional[str] = Query(
            None,
            description="Relationships to include: catalyst,support,method,"
                        "characterizations,observations,experiments,users"
        ),
        db: Session = Depends(get_db)
):
    """
    List samples with filtering, search, and relationship inclusion.
    
    Supports comprehensive filtering:
    - By source catalyst (all samples from a specific catalyst)
    - By support material (all samples using a specific support)
    - By preparation method
    - By depletion status (available vs consumed)
    - By name search
    
    The include parameter loads related entities to avoid N+1 queries:
    - include=catalyst: Load source catalyst data
    - include=support,method: Load multiple relationships
    - include=characterizations: Load characterization records
    """

    query = db.query(Sample)

    # Apply filters
    if search:
        query = query.filter(Sample.name.ilike(f"%{search}%"))

    if catalyst_id is not None:
        query = query.filter(Sample.catalyst_id == catalyst_id)

    if support_id is not None:
        query = query.filter(Sample.support_id == support_id)

    if method_id is not None:
        query = query.filter(Sample.method_id == method_id)

    if depleted is not None:
        if depleted:
            query = query.filter(Sample.remaining_amount <= 0.0001)
        else:
            query = query.filter(Sample.remaining_amount > 0.0001)

    # Apply eager loading based on include parameter
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalyst' in include_rels:
            query = query.options(joinedload(Sample.catalyst))
        if 'support' in include_rels:
            query = query.options(joinedload(Sample.support))
        if 'method' in include_rels:
            query = query.options(joinedload(Sample.method))
        if 'characterizations' in include_rels:
            query = query.options(joinedload(Sample.characterizations))
        if 'observations' in include_rels:
            query = query.options(joinedload(Sample.observations))
        if 'experiments' in include_rels:
            query = query.options(joinedload(Sample.experiments))
        if 'users' in include_rels:
            query = query.options(joinedload(Sample.users))

    # Order by creation date (newest first)
    query = query.order_by(Sample.created_at.desc())

    samples = query.offset(skip).limit(limit).all()
    return samples


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{sample_id}", response_model=SampleResponse)
def get_sample(
        sample_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single sample by ID with optional relationship inclusion.
    """

    query = db.query(Sample)

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalyst' in include_rels:
            query = query.options(joinedload(Sample.catalyst))
        if 'support' in include_rels:
            query = query.options(joinedload(Sample.support))
        if 'method' in include_rels:
            query = query.options(joinedload(Sample.method))
        if 'characterizations' in include_rels:
            query = query.options(joinedload(Sample.characterizations))
        if 'observations' in include_rels:
            query = query.options(joinedload(Sample.observations))
        if 'experiments' in include_rels:
            query = query.options(joinedload(Sample.experiments))
        if 'users' in include_rels:
            query = query.options(joinedload(Sample.users))

    sample = query.filter(Sample.id == sample_id).first()

    if sample is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    return sample


@router.post("/", response_model=SampleResponse, status_code=status.HTTP_201_CREATED)
def create_sample(
        sample: SampleCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new sample with optional relationship associations.
    
    Validates:
    - Catalyst ID exists (if provided)
    - Support ID exists (if provided)
    - Method ID exists (if provided)
    - remaining_amount <= yield_amount (via schema)
    
    Optionally establishes relationships to:
    - Characterizations (characterization_ids)
    - Observations (observation_ids)
    - Users (user_ids)
    """

    # Validate foreign key references
    if sample.catalyst_id:
        catalyst = db.query(Catalyst).filter(Catalyst.id == sample.catalyst_id).first()
        if not catalyst:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Catalyst with ID {sample.catalyst_id} not found"
            )

    if sample.support_id:
        support = db.query(Support).filter(Support.id == sample.support_id).first()
        if not support:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Support with ID {sample.support_id} not found"
            )

    if sample.method_id:
        method = db.query(Method).filter(Method.id == sample.method_id).first()
        if not method:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Method with ID {sample.method_id} not found"
            )

    # Create sample instance (exclude relationship IDs)
    sample_data = sample.model_dump(exclude={
        'characterization_ids', 'observation_ids', 'user_ids'
    })
    db_sample = Sample(**sample_data)

    # Establish characterization relationships
    if sample.characterization_ids:
        characterizations = db.query(Characterization).filter(
            Characterization.id.in_(sample.characterization_ids)
        ).all()
        found_ids = {c.id for c in characterizations}
        missing_ids = set(sample.characterization_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Characterization IDs not found: {sorted(missing_ids)}"
            )
        db_sample.characterizations = characterizations

    # Establish observation relationships
    if sample.observation_ids:
        observations = db.query(Observation).filter(
            Observation.id.in_(sample.observation_ids)
        ).all()
        found_ids = {o.id for o in observations}
        missing_ids = set(sample.observation_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Observation IDs not found: {sorted(missing_ids)}"
            )
        db_sample.observations = observations

    # Establish user relationships
    if sample.user_ids:
        users = db.query(User).filter(User.id.in_(sample.user_ids)).all()
        found_ids = {u.id for u in users}
        missing_ids = set(sample.user_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User IDs not found: {sorted(missing_ids)}"
            )
        db_sample.users = users

    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)

    return db_sample


@router.patch("/{sample_id}", response_model=SampleResponse)
def update_sample(
        sample_id: int,
        sample_update: SampleUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a sample with partial data.
    
    Supports updating:
    - Basic fields (name, storage_location, notes, etc.)
    - Foreign key references (catalyst_id, support_id, method_id)
    - Inventory values (yield_amount, remaining_amount)
    - Relationship associations (characterization_ids, etc.)
    """

    db_sample = db.query(Sample).filter(Sample.id == sample_id).first()

    if db_sample is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    update_data = sample_update.model_dump(exclude_unset=True)

    # Validate foreign key updates
    if 'catalyst_id' in update_data and update_data['catalyst_id']:
        catalyst = db.query(Catalyst).filter(
            Catalyst.id == update_data['catalyst_id']
        ).first()
        if not catalyst:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Catalyst with ID {update_data['catalyst_id']} not found"
            )

    if 'support_id' in update_data and update_data['support_id']:
        support = db.query(Support).filter(
            Support.id == update_data['support_id']
        ).first()
        if not support:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Support with ID {update_data['support_id']} not found"
            )

    if 'method_id' in update_data and update_data['method_id']:
        method = db.query(Method).filter(
            Method.id == update_data['method_id']
        ).first()
        if not method:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Method with ID {update_data['method_id']} not found"
            )

    # Handle relationship updates
    if 'characterization_ids' in update_data:
        char_ids = update_data.pop('characterization_ids')
        if char_ids is not None:
            characterizations = db.query(Characterization).filter(
                Characterization.id.in_(char_ids)
            ).all()
            db_sample.characterizations = characterizations

    if 'observation_ids' in update_data:
        obs_ids = update_data.pop('observation_ids')
        if obs_ids is not None:
            observations = db.query(Observation).filter(
                Observation.id.in_(obs_ids)
            ).all()
            db_sample.observations = observations

    if 'user_ids' in update_data:
        user_ids_list = update_data.pop('user_ids')
        if user_ids_list is not None:
            users = db.query(User).filter(User.id.in_(user_ids_list)).all()
            db_sample.users = users

    # Update scalar fields
    for field, value in update_data.items():
        setattr(db_sample, field, value)

    # Validate remaining vs yield after updates
    if db_sample.remaining_amount > db_sample.yield_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="remaining_amount cannot exceed yield_amount"
        )

    db.commit()
    db.refresh(db_sample)

    return db_sample


@router.delete("/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sample(
        sample_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a sample.
    
    Warning: This also removes the sample's links to characterizations,
    observations, experiments, and users through cascade delete on the
    junction tables.
    """

    db_sample = db.query(Sample).filter(Sample.id == sample_id).first()

    if db_sample is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    db.delete(db_sample)
    db.commit()

    return None


# =============================================================================
# Specialized Endpoints
# =============================================================================

@router.patch("/{sample_id}/consume", response_model=SampleResponse)
def consume_sample_material(
        sample_id: int,
        amount: Decimal = Query(..., gt=0, description="Amount to consume"),
        notes: Optional[str] = Query(None, description="Notes about consumption"),
        db: Session = Depends(get_db)
):
    """
    Consume material from a sample's inventory.
    
    This is a convenience endpoint for reducing remaining_amount.
    More semantic than a generic PATCH because it:
    - Validates sufficient material is available
    - Optionally records consumption notes
    - Returns clear error if sample is depleted
    """

    db_sample = db.query(Sample).filter(Sample.id == sample_id).first()

    if db_sample is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    current_amount = Decimal(str(db_sample.remaining_amount))

    if amount > current_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot consume {amount}g - only {current_amount}g remaining"
        )

    db_sample.remaining_amount = current_amount - amount

    # Optionally append consumption note
    if notes:
        existing_notes = db_sample.notes or ""
        timestamp = db_sample.updated_at.strftime("%Y-%m-%d")
        consumption_note = f"\n[{timestamp}] Consumed {amount}g: {notes}"
        db_sample.notes = existing_notes + consumption_note

    db.commit()
    db.refresh(db_sample)

    return db_sample


# =============================================================================
# Relationship Management Endpoints
# =============================================================================

@router.post("/{sample_id}/characterizations/{characterization_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_characterization_to_sample(
        sample_id: int,
        characterization_id: int,
        db: Session = Depends(get_db)
):
    """
    Link a characterization to this sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    characterization = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not characterization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    if characterization not in sample.characterizations:
        sample.characterizations.append(characterization)
        db.commit()

    return None


@router.delete("/{sample_id}/characterizations/{characterization_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_characterization_from_sample(
        sample_id: int,
        characterization_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a characterization link from this sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    characterization = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not characterization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    if characterization in sample.characterizations:
        sample.characterizations.remove(characterization)
        db.commit()

    return None


@router.post("/{sample_id}/observations/{observation_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_observation_to_sample(
        sample_id: int,
        observation_id: int,
        db: Session = Depends(get_db)
):
    """
    Link an observation to this sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    observation = db.query(Observation).filter(
        Observation.id == observation_id
    ).first()
    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    if observation not in sample.observations:
        sample.observations.append(observation)
        db.commit()

    return None


@router.delete("/{sample_id}/observations/{observation_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_observation_from_sample(
        sample_id: int,
        observation_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove an observation link from this sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    observation = db.query(Observation).filter(
        Observation.id == observation_id
    ).first()
    if not observation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Observation {observation_id} not found"
        )

    if observation in sample.observations:
        sample.observations.remove(observation)
        db.commit()

    return None


@router.post("/{sample_id}/users/{user_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_user_to_sample(
        sample_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Record that a user worked on this sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    if user not in sample.users:
        sample.users.append(user)
        db.commit()

    return None


@router.delete("/{sample_id}/users/{user_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_sample(
        sample_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a user's association with this sample.
    """

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    if user in sample.users:
        sample.users.remove(user)
        db.commit()

    return None