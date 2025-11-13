"""
Support API router.

Supports are substrate materials that catalysts can be applied to or combined
with. This router is relatively straightforward in Phase One because the main
relationships (to samples) will be implemented in Phase Two.

The router demonstrates:
- Managing simple reference data with descriptive documentation
- Preparing for future relationship inclusion
- Standard CRUD patterns for entities with minimal business logic

TODO: Phase Two enhancements when Sample model is implemented:
- Add samples relationship to SupportsResponse schema
- Implement include=samples parameter for listing samples on each support
- Add usage statistics showing how many samples use each support
- Add validation preventing deletion of supports used by active samples
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.catalysts.support import Support
from app.schemas.catalysts.support import SupportCreate, SupportUpdate, SupportResponse

router = APIRouter(
    prefix="/api/supports",
    tags=["Supports"]
)


@router.get("/", response_model=List[SupportResponse])
def list_supports(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in support names and descriptions"),
        db: Session = Depends(get_db)
):
    """
    List all supports with optional search and pagination.
    
    Supports are ordered alphabetically because researchers think of them
    by material type. When preparing a sample, you might search for "alumina"
    or "silica" to find the appropriate support, making alphabetical order
    most intuitive.
    
    TODO: Add include parameter for Phase Two sample relationships
    When samples are implemented, add: include=samples to show all samples
    using each support. The pattern will match the method router's chemicals
    inclusion.
    
    Args:
        skip: Pagination offset
        limit: Page size
        search: Text to match in names and descriptions
        db: Database session
    
    Returns:
        List[SupportResponse]: Supports matching search criteria
    """

    query = db.query(Support)

    # Search across both name and description fields
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Support.descriptive_name.ilike(search_pattern)) |
            (Support.description.ilike(search_pattern))
        )

    # Alphabetical ordering for easy scanning
    query = query.order_by(Support.descriptive_name.asc())

    supports = query.offset(skip).limit(limit).all()

    return supports


@router.get("/{support_id}", response_model=SupportResponse)
def get_support(
        support_id: int,
        db: Session = Depends(get_db)
):
    """
    Retrieve a single support by ID.
    
    TODO: Add include parameter in Phase Two
    GET /api/supports/1?include=samples will load sample relationships
    showing all samples created using this support material.
    
    Args:
        support_id: The support's unique identifier
        db: Database session
    
    Returns:
        SupportResponse: The requested support
    
    Raises:
        HTTPException(404): If support not found
    """

    support = db.query(Support).filter(Support.id == support_id).first()

    if support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support with ID {support_id} not found"
        )

    return support


@router.post("/", response_model=SupportResponse, status_code=status.HTTP_201_CREATED)
def create_support(
        support: SupportCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new support material.
    
    **Uniqueness on Descriptive Name:**
    The descriptive_name must be unique to prevent confusion between support
    materials. Different support materials should have distinguishable names
    even if they're the same base material with different specifications.
    For example, "γ-Alumina 200 m²/g" and "γ-Alumina 300 m²/g" are different
    supports.
    
    Args:
        support: Support data validated by SupportCreate schema
        db: Database session
    
    Returns:
        SupportResponse: The created support
    
    Raises:
        HTTPException(400): If a support with this name already exists
    """

    # Check for existing support with the same name
    existing = db.query(Support).filter(
        Support.descriptive_name == support.descriptive_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A support named '{support.descriptive_name}' already exists"
        )

    db_support = Support(**support.model_dump())
    db.add(db_support)
    db.commit()
    db.refresh(db_support)

    return db_support


@router.patch("/{support_id}", response_model=SupportResponse)
def update_support(
        support_id: int,
        support_update: SupportUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a support material.
    
    Similar to chemicals, updating a support's name affects all samples that
    reference it. For historical accuracy, creating a new support and migrating
    samples to it might be preferable to renaming an existing support that's
    been used in published research.
    
    Args:
        support_id: ID of support to update
        support_update: Fields to update
        db: Database session
    
    Returns:
        SupportResponse: The updated support
    
    Raises:
        HTTPException(404): If support not found
        HTTPException(400): If name update would create duplicate
    """

    db_support = db.query(Support).filter(Support.id == support_id).first()

    if db_support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support with ID {support_id} not found"
        )

    update_data = support_update.model_dump(exclude_unset=True)

    # Check name uniqueness if being updated
    if 'descriptive_name' in update_data and update_data['descriptive_name'] != db_support.descriptive_name:
        existing = db.query(Support).filter(
            Support.descriptive_name == update_data['descriptive_name'],
            Support.id != support_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A support named '{update_data['descriptive_name']}' already exists"
            )

    for field, value in update_data.items():
        setattr(db_support, field, value)

    db.commit()
    db.refresh(db_support)

    return db_support


@router.delete("/{support_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_support(
        support_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a support material.
    
    TODO: Add protection in Phase Two when samples are implemented
    Before deleting, check if any samples reference this support:
    
    sample_count = db.query(Sample).filter(
        Sample.support_id == support_id
    ).count()
    
    if sample_count > 0:
        raise HTTPException(409, f"Cannot delete: {sample_count} samples use this support")
    
    This prevents orphaning sample records that need support information
    for reproducibility.
    
    Args:
        support_id: ID of support to delete
        db: Database session
    
    Returns:
        None (204 No Content)
    
    Raises:
        HTTPException(404): If support not found
    """

    db_support = db.query(Support).filter(Support.id == support_id).first()

    if db_support is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Support with ID {support_id} not found"
        )

    db.delete(db_support)
    db.commit()

    return None