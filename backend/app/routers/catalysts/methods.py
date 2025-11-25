"""
Method API router.

Methods document synthesis procedures for creating catalysts and samples.
This router provides CRUD operations and relationship management.

Endpoint Summary:
- GET    /api/methods/           List with filtering
- POST   /api/methods/           Create new method
- GET    /api/methods/{id}       Get details
- PATCH  /api/methods/{id}       Update
- DELETE /api/methods/{id}       Delete (fails if in use)
- POST   /api/methods/{id}/chemicals/{chemical_id}  Add chemical
- DELETE /api/methods/{id}/chemicals/{chemical_id}  Remove chemical
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.catalysts.method import Method, UserMethod
from app.models.catalysts.chemical import Chemical
from app.models.core.user import User
from app.schemas.catalysts.method import (
    MethodCreate, MethodUpdate, MethodResponse
)

router = APIRouter(
    prefix="/api/methods",
    tags=["Methods"]
)


@router.get("/", response_model=List[MethodResponse])
def list_methods(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in name and procedure"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        include: Optional[str] = Query(
            None,
            description="Relationships: chemicals,catalysts,samples"
        ),
        db: Session = Depends(get_db)
):
    """
    List methods with filtering and relationship inclusion.
    """

    query = db.query(Method)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Method.descriptive_name.ilike(search_pattern)) |
            (Method.procedure.ilike(search_pattern))
        )

    if is_active is not None:
        query = query.filter(Method.is_active == is_active)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'chemicals' in include_rels:
            query = query.options(joinedload(Method.chemicals))
        if 'catalysts' in include_rels:
            query = query.options(joinedload(Method.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Method.samples))

    query = query.order_by(Method.created_at.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/{method_id}", response_model=MethodResponse)
def get_method(
        method_id: int,
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single method by ID.
    """

    query = db.query(Method)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'chemicals' in include_rels:
            query = query.options(joinedload(Method.chemicals))
        if 'catalysts' in include_rels:
            query = query.options(joinedload(Method.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(Method.samples))

    method = query.filter(Method.id == method_id).first()

    if method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    return method


@router.post("/", response_model=MethodResponse, status_code=status.HTTP_201_CREATED)
def create_method(
        method: MethodCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new synthesis method.
    """

    # Create method
    method_data = method.model_dump(exclude={'chemical_ids'})
    db_method = Method(**method_data)

    # Establish chemical relationships
    if method.chemical_ids:
        chemicals = db.query(Chemical).filter(
            Chemical.id.in_(method.chemical_ids)
        ).all()
        found_ids = {c.id for c in chemicals}
        missing_ids = set(method.chemical_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chemical IDs not found: {sorted(missing_ids)}"
            )
        db_method.chemicals = chemicals

    db.add(db_method)
    db.commit()
    db.refresh(db_method)

    return db_method


@router.patch("/{method_id}", response_model=MethodResponse)
def update_method(
        method_id: int,
        method_update: MethodUpdate,
        user_id: Optional[int] = Query(None, description="User making the change"),
        change_notes: Optional[str] = Query(None, description="Notes about this change"),
        db: Session = Depends(get_db)
):
    """
    Update a method with partial data.
    
    Optionally records who made the change and why via the user_method
    audit table.
    """

    db_method = db.query(Method).filter(Method.id == method_id).first()

    if db_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    update_data = method_update.model_dump(exclude_unset=True)

    # Handle chemical relationship updates
    if 'chemical_ids' in update_data:
        ids = update_data.pop('chemical_ids')
        if ids is not None:
            chemicals = db.query(Chemical).filter(Chemical.id.in_(ids)).all()
            db_method.chemicals = chemicals

    # Update scalar fields
    for field, value in update_data.items():
        setattr(db_method, field, value)

    # Record the change in audit table if user provided
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user_method = UserMethod(
                user_id=user_id,
                method_id=method_id,
                change_notes=change_notes
            )
            db.add(user_method)

    db.commit()
    db.refresh(db_method)

    return db_method


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_method(
        method_id: int,
        force: bool = Query(False, description="Force delete even if in use"),
        db: Session = Depends(get_db)
):
    """
    Delete a method.
    
    Fails if the method is referenced by catalysts or samples unless
    force=True is specified. Consider deactivating instead of deleting.
    """

    db_method = db.query(Method).filter(Method.id == method_id).first()

    if db_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    # Check if in use
    if not force and db_method.is_in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Method is in use by {db_method.catalyst_count} catalysts and "
                   f"{db_method.sample_count} samples. Use force=true to delete anyway "
                   "or consider deactivating instead (PATCH with is_active=false)."
        )

    db.delete(db_method)
    db.commit()

    return None


# =============================================================================
# Chemical Relationship Endpoints
# =============================================================================

@router.post("/{method_id}/chemicals/{chemical_id}",
             status_code=status.HTTP_204_NO_CONTENT)
def add_chemical_to_method(
        method_id: int,
        chemical_id: int,
        db: Session = Depends(get_db)
):
    """
    Add a chemical to this method's list of required chemicals.
    """

    method = db.query(Method).filter(Method.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail=f"Method {method_id} not found")

    chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()
    if not chemical:
        raise HTTPException(status_code=404, detail=f"Chemical {chemical_id} not found")

    if chemical not in method.chemicals:
        method.chemicals.append(chemical)
        db.commit()

    return None


@router.delete("/{method_id}/chemicals/{chemical_id}",
               status_code=status.HTTP_204_NO_CONTENT)
def remove_chemical_from_method(
        method_id: int,
        chemical_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a chemical from this method's list.
    """

    method = db.query(Method).filter(Method.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail=f"Method {method_id} not found")

    chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()
    if not chemical:
        raise HTTPException(status_code=404, detail=f"Chemical {chemical_id} not found")

    if chemical in method.chemicals:
        method.chemicals.remove(chemical)
        db.commit()

    return None
