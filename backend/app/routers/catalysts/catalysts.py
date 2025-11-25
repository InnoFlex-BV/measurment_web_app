"""
Catalyst API router.

Catalysts are the core research artifacts - synthesized materials that are
characterized and tested. This router provides CRUD operations and relationship
management for catalysts.

Endpoint Summary:
- GET    /api/catalysts/              List with filtering
- POST   /api/catalysts/              Create new catalyst
- GET    /api/catalysts/{id}          Get details
- PATCH  /api/catalysts/{id}          Update
- DELETE /api/catalysts/{id}          Delete
- PATCH  /api/catalysts/{id}/consume  Consume material
- POST   /api/catalysts/{id}/input-catalysts/{input_id}    Add derivation link
- DELETE /api/catalysts/{id}/input-catalysts/{input_id}    Remove derivation link
- POST   /api/catalysts/{id}/characterizations/{char_id}   Link characterization
- DELETE /api/catalysts/{id}/characterizations/{char_id}   Unlink characterization
- POST   /api/catalysts/{id}/observations/{obs_id}         Link observation
- DELETE /api/catalysts/{id}/observations/{obs_id}         Unlink observation
- POST   /api/catalysts/{id}/users/{user_id}               Link user
- DELETE /api/catalysts/{id}/users/{user_id}               Unlink user
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models.catalysts.catalyst import Catalyst
from app.models.catalysts.method import Method
from app.models.analysis.characterization import Characterization
from app.models.analysis.observation import Observation
from app.models.core.user import User
from app.schemas.catalysts.catalyst import (
    CatalystCreate, CatalystUpdate, CatalystResponse
)

router = APIRouter(
    prefix="/api/catalysts",
    tags=["Catalysts"]
)


@router.get("/", response_model=List[CatalystResponse])
def list_catalysts(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in catalyst names"),
        method_id: Optional[int] = Query(None, description="Filter by synthesis method"),
        depleted: Optional[bool] = Query(None, description="Filter by depletion status"),
        include: Optional[str] = Query(
            None,
            description="Relationships: method,input_catalysts,output_catalysts,"
                        "samples,characterizations,observations,users"
        ),
        db: Session = Depends(get_db)
):
    """
    List catalysts with filtering and relationship inclusion.
    """

    query = db.query(Catalyst)

    if search:
        query = query.filter(Catalyst.name.ilike(f"%{search}%"))

    if method_id is not None:
        query = query.filter(Catalyst.method_id == method_id)

    if depleted is not None:
        if depleted:
            query = query.filter(Catalyst.remaining_amount <= 0.0001)
        else:
            query = query.filter(Catalyst.remaining_amount > 0.0001)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'method' in include_rels:
            query = query.options(joinedload(Catalyst.method))
        if 'input_catalysts' in include_rels:
            query = query.options(joinedload(Catalyst.input_catalysts))
        if 'output_catalysts' in include_rels:
            query = query.options(joinedload(Catalyst.output_catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Catalyst.samples))
        if 'characterizations' in include_rels:
            query = query.options(joinedload(Catalyst.characterizations))
        if 'observations' in include_rels:
            query = query.options(joinedload(Catalyst.observations))
        if 'users' in include_rels:
            query = query.options(joinedload(Catalyst.users))

    query = query.order_by(Catalyst.created_at.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/{catalyst_id}", response_model=CatalystResponse)
def get_catalyst(
        catalyst_id: int,
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single catalyst by ID.
    """

    query = db.query(Catalyst)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'method' in include_rels:
            query = query.options(joinedload(Catalyst.method))
        if 'input_catalysts' in include_rels:
            query = query.options(joinedload(Catalyst.input_catalysts))
        if 'output_catalysts' in include_rels:
            query = query.options(joinedload(Catalyst.output_catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Catalyst.samples))
        if 'characterizations' in include_rels:
            query = query.options(joinedload(Catalyst.characterizations))
        if 'observations' in include_rels:
            query = query.options(joinedload(Catalyst.observations))
        if 'users' in include_rels:
            query = query.options(joinedload(Catalyst.users))

    catalyst = query.filter(Catalyst.id == catalyst_id).first()

    if catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    return catalyst


@router.post("/", response_model=CatalystResponse, status_code=status.HTTP_201_CREATED)
def create_catalyst(
        catalyst: CatalystCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new catalyst.
    """

    # Validate method reference
    if catalyst.method_id:
        method = db.query(Method).filter(Method.id == catalyst.method_id).first()
        if not method:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Method with ID {catalyst.method_id} not found"
            )

    # Create catalyst
    cat_data = catalyst.model_dump(exclude={
        'input_catalyst_ids', 'characterization_ids',
        'observation_ids', 'user_ids'
    })
    db_catalyst = Catalyst(**cat_data)

    # Establish input catalyst relationships
    if catalyst.input_catalyst_ids:
        input_cats = db.query(Catalyst).filter(
            Catalyst.id.in_(catalyst.input_catalyst_ids)
        ).all()
        found_ids = {c.id for c in input_cats}
        missing_ids = set(catalyst.input_catalyst_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Input catalyst IDs not found: {sorted(missing_ids)}"
            )
        db_catalyst.input_catalysts = input_cats

    # Establish characterization relationships
    if catalyst.characterization_ids:
        chars = db.query(Characterization).filter(
            Characterization.id.in_(catalyst.characterization_ids)
        ).all()
        db_catalyst.characterizations = chars

    # Establish observation relationships
    if catalyst.observation_ids:
        obs = db.query(Observation).filter(
            Observation.id.in_(catalyst.observation_ids)
        ).all()
        db_catalyst.observations = obs

    # Establish user relationships
    if catalyst.user_ids:
        users = db.query(User).filter(User.id.in_(catalyst.user_ids)).all()
        db_catalyst.users = users

    db.add(db_catalyst)
    db.commit()
    db.refresh(db_catalyst)

    return db_catalyst


@router.patch("/{catalyst_id}", response_model=CatalystResponse)
def update_catalyst(
        catalyst_id: int,
        catalyst_update: CatalystUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a catalyst with partial data.
    """

    db_catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()

    if db_catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    update_data = catalyst_update.model_dump(exclude_unset=True)

    # Validate method if updating
    if 'method_id' in update_data and update_data['method_id']:
        method = db.query(Method).filter(Method.id == update_data['method_id']).first()
        if not method:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Method with ID {update_data['method_id']} not found"
            )

    # Handle relationship updates
    if 'input_catalyst_ids' in update_data:
        ids = update_data.pop('input_catalyst_ids')
        if ids is not None:
            cats = db.query(Catalyst).filter(Catalyst.id.in_(ids)).all()
            db_catalyst.input_catalysts = cats

    if 'characterization_ids' in update_data:
        ids = update_data.pop('characterization_ids')
        if ids is not None:
            chars = db.query(Characterization).filter(Characterization.id.in_(ids)).all()
            db_catalyst.characterizations = chars

    if 'observation_ids' in update_data:
        ids = update_data.pop('observation_ids')
        if ids is not None:
            obs = db.query(Observation).filter(Observation.id.in_(ids)).all()
            db_catalyst.observations = obs

    if 'user_ids' in update_data:
        ids = update_data.pop('user_ids')
        if ids is not None:
            users = db.query(User).filter(User.id.in_(ids)).all()
            db_catalyst.users = users

    # Update scalar fields
    for field, value in update_data.items():
        setattr(db_catalyst, field, value)

    # Validate remaining vs yield
    if db_catalyst.remaining_amount > db_catalyst.yield_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="remaining_amount cannot exceed yield_amount"
        )

    db.commit()
    db.refresh(db_catalyst)

    return db_catalyst


@router.delete("/{catalyst_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_catalyst(
        catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a catalyst.
    
    Warning: This will also delete all samples derived from this catalyst
    due to cascade delete.
    """

    db_catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()

    if db_catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    db.delete(db_catalyst)
    db.commit()

    return None


@router.patch("/{catalyst_id}/consume", response_model=CatalystResponse)
def consume_catalyst_material(
        catalyst_id: int,
        amount: Decimal = Query(..., gt=0),
        notes: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    Consume material from a catalyst's inventory.
    """

    db_catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()

    if db_catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    current_amount = Decimal(str(db_catalyst.remaining_amount))

    if amount > current_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot consume {amount}g - only {current_amount}g remaining"
        )

    db_catalyst.remaining_amount = current_amount - amount

    if notes:
        existing_notes = db_catalyst.notes or ""
        timestamp = db_catalyst.updated_at.strftime("%Y-%m-%d")
        consumption_note = f"\n[{timestamp}] Consumed {amount}g: {notes}"
        db_catalyst.notes = existing_notes + consumption_note

    db.commit()
    db.refresh(db_catalyst)

    return db_catalyst


# =============================================================================
# Relationship Management Endpoints
# =============================================================================

@router.post("/{catalyst_id}/input-catalysts/{input_catalyst_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_input_catalyst(
        catalyst_id: int,
        input_catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Link an input catalyst (derivation relationship).
    """

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    input_cat = db.query(Catalyst).filter(Catalyst.id == input_catalyst_id).first()
    if not input_cat:
        raise HTTPException(status_code=404, detail=f"Catalyst {input_catalyst_id} not found")

    if input_cat not in catalyst.input_catalysts:
        catalyst.input_catalysts.append(input_cat)
        db.commit()

    return None


@router.delete("/{catalyst_id}/input-catalysts/{input_catalyst_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_input_catalyst(
        catalyst_id: int,
        input_catalyst_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove an input catalyst link.
    """

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    input_cat = db.query(Catalyst).filter(Catalyst.id == input_catalyst_id).first()
    if not input_cat:
        raise HTTPException(status_code=404, detail=f"Catalyst {input_catalyst_id} not found")

    if input_cat in catalyst.input_catalysts:
        catalyst.input_catalysts.remove(input_cat)
        db.commit()

    return None


@router.post("/{catalyst_id}/characterizations/{characterization_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_characterization_to_catalyst(
        catalyst_id: int,
        characterization_id: int,
        db: Session = Depends(get_db)
):
    """Link a characterization to this catalyst."""

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    char = db.query(Characterization).filter(Characterization.id == characterization_id).first()
    if not char:
        raise HTTPException(status_code=404, detail=f"Characterization {characterization_id} not found")

    if char not in catalyst.characterizations:
        catalyst.characterizations.append(char)
        db.commit()

    return None


@router.delete("/{catalyst_id}/characterizations/{characterization_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_characterization_from_catalyst(
        catalyst_id: int,
        characterization_id: int,
        db: Session = Depends(get_db)
):
    """Remove a characterization link."""

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    char = db.query(Characterization).filter(Characterization.id == characterization_id).first()
    if not char:
        raise HTTPException(status_code=404, detail=f"Characterization {characterization_id} not found")

    if char in catalyst.characterizations:
        catalyst.characterizations.remove(char)
        db.commit()

    return None


@router.post("/{catalyst_id}/observations/{observation_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_observation_to_catalyst(
        catalyst_id: int,
        observation_id: int,
        db: Session = Depends(get_db)
):
    """Link an observation to this catalyst."""

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail=f"Observation {observation_id} not found")

    if obs not in catalyst.observations:
        catalyst.observations.append(obs)
        db.commit()

    return None


@router.delete("/{catalyst_id}/observations/{observation_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_observation_from_catalyst(
        catalyst_id: int,
        observation_id: int,
        db: Session = Depends(get_db)
):
    """Remove an observation link."""

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    obs = db.query(Observation).filter(Observation.id == observation_id).first()
    if not obs:
        raise HTTPException(status_code=404, detail=f"Observation {observation_id} not found")

    if obs in catalyst.observations:
        catalyst.observations.remove(obs)
        db.commit()

    return None


@router.post("/{catalyst_id}/users/{user_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_user_to_catalyst(
        catalyst_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """Record that a user worked on this catalyst."""

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    if user not in catalyst.users:
        catalyst.users.append(user)
        db.commit()

    return None


@router.delete("/{catalyst_id}/users/{user_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_catalyst(
        catalyst_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """Remove a user's association with this catalyst."""

    catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()
    if not catalyst:
        raise HTTPException(status_code=404, detail=f"Catalyst {catalyst_id} not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    if user in catalyst.users:
        catalyst.users.remove(user)
        db.commit()

    return None
