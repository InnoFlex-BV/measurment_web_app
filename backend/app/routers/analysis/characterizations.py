"""
Characterization API router.

Characterizations represent analytical measurements performed on catalysts
and samples. This router provides CRUD operations and relationship management
for linking characterizations to materials, data files, and users.

Endpoint Summary:
- GET    /api/characterizations/              List with filtering
- POST   /api/characterizations/              Create new characterization
- GET    /api/characterizations/{id}          Get details
- PATCH  /api/characterizations/{id}          Update
- DELETE /api/characterizations/{id}          Delete
- POST   /api/characterizations/{id}/catalysts/{catalyst_id}    Link catalyst
- DELETE /api/characterizations/{id}/catalysts/{catalyst_id}    Unlink catalyst
- POST   /api/characterizations/{id}/samples/{sample_id}        Link sample
- DELETE /api/characterizations/{id}/samples/{sample_id}        Unlink sample
- POST   /api/characterizations/{id}/users/{user_id}            Link user
- DELETE /api/characterizations/{id}/users/{user_id}            Unlink user
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.analysis.characterization import Characterization
from app.models.catalysts.catalyst import Catalyst
from app.models.catalysts.sample import Sample
from app.models.core.user import User
# File model will be imported in Phase 3
# from app.models.core.file import File
from app.schemas.analysis.characterization import (
    CharacterizationCreate, CharacterizationUpdate, CharacterizationResponse
)

router = APIRouter(
    prefix="/api/characterizations",
    tags=["Characterizations"]
)


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[CharacterizationResponse])
def list_characterizations(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        type_name: Optional[str] = Query(None, description="Filter by technique type"),
        search: Optional[str] = Query(None, description="Search in type and description"),
        catalyst_id: Optional[int] = Query(None, description="Filter by catalyst"),
        sample_id: Optional[int] = Query(None, description="Filter by sample"),
        has_data: Optional[bool] = Query(None, description="Filter by data file presence"),
        include: Optional[str] = Query(
            None,
            description="Relationships: catalysts,samples,users,processed_data_file,raw_data_file"
        ),
        db: Session = Depends(get_db)
):
    """
    List characterizations with filtering and relationship inclusion.
    
    Filtering options:
    - type_name: Exact match on technique (XRD, BET, etc.)
    - search: Partial match in type_name and description
    - catalyst_id: Only characterizations of a specific catalyst
    - sample_id: Only characterizations of a specific sample
    - has_data: True for those with files attached, False for those without
    """

    query = db.query(Characterization)

    # Apply filters
    if type_name:
        query = query.filter(Characterization.type_name == type_name)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Characterization.type_name.ilike(search_pattern)) |
            (Characterization.description.ilike(search_pattern))
        )

    if catalyst_id is not None:
        query = query.join(Characterization.catalysts).filter(
            Catalyst.id == catalyst_id
        )

    if sample_id is not None:
        query = query.join(Characterization.samples).filter(
            Sample.id == sample_id
        )

    if has_data is not None:
        if has_data:
            query = query.filter(
                (Characterization.raw_data_id.isnot(None)) |
                (Characterization.processed_data_id.isnot(None))
            )
        else:
            query = query.filter(
                (Characterization.raw_data_id.is_(None)) &
                (Characterization.processed_data_id.is_(None))
            )

    # Apply eager loading
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalysts' in include_rels:
            query = query.options(joinedload(Characterization.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Characterization.samples))
        if 'users' in include_rels:
            query = query.options(joinedload(Characterization.users))
        if 'processed_data_file' in include_rels:
            query = query.options(joinedload(Characterization.processed_data_file))
        if 'raw_data_file' in include_rels:
            query = query.options(joinedload(Characterization.raw_data_file))

    # Order by creation date
    query = query.order_by(Characterization.created_at.desc())

    characterizations = query.offset(skip).limit(limit).all()
    return characterizations


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{characterization_id}", response_model=CharacterizationResponse)
def get_characterization(
        characterization_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single characterization by ID.
    """

    query = db.query(Characterization)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalysts' in include_rels:
            query = query.options(joinedload(Characterization.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Characterization.samples))
        if 'users' in include_rels:
            query = query.options(joinedload(Characterization.users))
        if 'processed_data_file' in include_rels:
            query = query.options(joinedload(Characterization.processed_data_file))
        if 'raw_data_file' in include_rels:
            query = query.options(joinedload(Characterization.raw_data_file))

    characterization = query.filter(
        Characterization.id == characterization_id
    ).first()

    if characterization is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization with ID {characterization_id} not found"
        )

    return characterization


@router.post("/", response_model=CharacterizationResponse,
             status_code=status.HTTP_201_CREATED)
def create_characterization(
        characterization: CharacterizationCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new characterization with optional relationships.
    
    Can link to:
    - Catalysts (catalyst_ids): Materials analyzed
    - Samples (sample_ids): Materials analyzed
    - Users (user_ids): Who performed the characterization
    - Files (processed_data_id, raw_data_id): Data files
    """

    # Validate file references (Phase 3)
    # For now, we accept file IDs but don't validate them
    # TODO: Add file validation when File model is implemented

    # Create characterization instance
    char_data = characterization.model_dump(exclude={
        'catalyst_ids', 'sample_ids', 'user_ids'
    })
    db_char = Characterization(**char_data)

    # Establish catalyst relationships
    if characterization.catalyst_ids:
        catalysts = db.query(Catalyst).filter(
            Catalyst.id.in_(characterization.catalyst_ids)
        ).all()
        found_ids = {c.id for c in catalysts}
        missing_ids = set(characterization.catalyst_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Catalyst IDs not found: {sorted(missing_ids)}"
            )
        db_char.catalysts = catalysts

    # Establish sample relationships
    if characterization.sample_ids:
        samples = db.query(Sample).filter(
            Sample.id.in_(characterization.sample_ids)
        ).all()
        found_ids = {s.id for s in samples}
        missing_ids = set(characterization.sample_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sample IDs not found: {sorted(missing_ids)}"
            )
        db_char.samples = samples

    # Establish user relationships
    if characterization.user_ids:
        users = db.query(User).filter(
            User.id.in_(characterization.user_ids)
        ).all()
        found_ids = {u.id for u in users}
        missing_ids = set(characterization.user_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User IDs not found: {sorted(missing_ids)}"
            )
        db_char.users = users

    db.add(db_char)
    db.commit()
    db.refresh(db_char)

    return db_char


@router.patch("/{characterization_id}", response_model=CharacterizationResponse)
def update_characterization(
        characterization_id: int,
        char_update: CharacterizationUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a characterization with partial data.
    """

    db_char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()

    if db_char is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization with ID {characterization_id} not found"
        )

    update_data = char_update.model_dump(exclude_unset=True)

    # Handle relationship updates
    if 'catalyst_ids' in update_data:
        cat_ids = update_data.pop('catalyst_ids')
        if cat_ids is not None:
            catalysts = db.query(Catalyst).filter(
                Catalyst.id.in_(cat_ids)
            ).all()
            db_char.catalysts = catalysts

    if 'sample_ids' in update_data:
        samp_ids = update_data.pop('sample_ids')
        if samp_ids is not None:
            samples = db.query(Sample).filter(
                Sample.id.in_(samp_ids)
            ).all()
            db_char.samples = samples

    if 'user_ids' in update_data:
        user_ids_list = update_data.pop('user_ids')
        if user_ids_list is not None:
            users = db.query(User).filter(
                User.id.in_(user_ids_list)
            ).all()
            db_char.users = users

    # Update scalar fields
    for field, value in update_data.items():
        setattr(db_char, field, value)

    db.commit()
    db.refresh(db_char)

    return db_char


@router.delete("/{characterization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_characterization(
        characterization_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a characterization.
    
    This removes all links to catalysts, samples, and users through
    cascade delete on the junction tables.
    """

    db_char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()

    if db_char is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization with ID {characterization_id} not found"
        )

    db.delete(db_char)
    db.commit()

    return None


# =============================================================================
# Relationship Management Endpoints
# =============================================================================

@router.post("/{characterization_id}/catalysts/{catalyst_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_catalyst_to_characterization(
        characterization_id: int,
        catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Link a catalyst to this characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst {catalyst_id} not found"
        )

    if catalyst not in char.catalysts:
        char.catalysts.append(catalyst)
        db.commit()

    return None


@router.delete("/{characterization_id}/catalysts/{catalyst_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_catalyst_from_characterization(
        characterization_id: int,
        catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a catalyst link from this characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst {catalyst_id} not found"
        )

    if catalyst in char.catalysts:
        char.catalysts.remove(catalyst)
        db.commit()

    return None


@router.post("/{characterization_id}/samples/{sample_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_sample_to_characterization(
        characterization_id: int,
        sample_id: int,
        db: Session = Depends(get_db)
):
    """
    Link a sample to this characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    if sample not in char.samples:
        char.samples.append(sample)
        db.commit()

    return None


@router.delete("/{characterization_id}/samples/{sample_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_sample_from_characterization(
        characterization_id: int,
        sample_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a sample link from this characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample {sample_id} not found"
        )

    if sample in char.samples:
        char.samples.remove(sample)
        db.commit()

    return None


@router.post("/{characterization_id}/users/{user_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_user_to_characterization(
        characterization_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Record that a user performed this characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    if user not in char.users:
        char.users.append(user)
        db.commit()

    return None


@router.delete("/{characterization_id}/users/{user_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_characterization(
        characterization_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a user's association with this characterization.
    """

    char = db.query(Characterization).filter(
        Characterization.id == characterization_id
    ).first()
    if not char:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Characterization {characterization_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )

    if user in char.users:
        char.users.remove(user)
        db.commit()

    return None