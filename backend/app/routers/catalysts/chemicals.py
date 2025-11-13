"""
Chemical API router.

This router manages chemical compounds that are used in synthesis methods.
Chemicals are primarily reference data - they exist to be referenced by
methods through the chemical_method junction table. This makes the router
relatively simple compared to more complex entities like catalysts.

This router demonstrates patterns for:
- Managing simple reference/lookup data
- Handling uniqueness constraints on natural keys (name)
- Providing search functionality for reference data
- Preventing deletion of referenced entities

The patterns established here apply to other reference data entities
you'll add in future phases like contaminants, carriers, and waveforms.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.catalysts.chemical import Chemical
from app.schemas.catalysts.chemical import ChemicalCreate, ChemicalUpdate, ChemicalResponse

router = APIRouter(
    prefix="/api/chemicals",
    tags=["Chemicals"]
)


@router.get("/", response_model=List[ChemicalResponse])
def list_chemicals(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in chemical names"),
        db: Session = Depends(get_db)
):
    """
    List all chemicals with optional search and pagination.
    
    For reference data like chemicals, search functionality is particularly
    important because users need to quickly find whether a chemical already
    exists before creating a new one. The search is case-insensitive and
    matches partial names, making it easy to find "ethanol" by searching "eth".
    
    **Alphabetical Ordering:**
    Unlike users which are ordered by creation date, chemicals are ordered
    alphabetically by name. This makes sense for reference data because
    researchers think of chemicals by name, not by when they were added to
    the database. Alphabetical ordering also makes the list easier to scan
    when displaying in a dropdown or autocomplete.
    
    Args:
        skip: Pagination offset
        limit: Page size
        search: Text to match against chemical names
        db: Database session
    
    Returns:
        List[ChemicalResponse]: Chemicals matching the search criteria
    """

    query = db.query(Chemical)

    # Apply search filter if provided
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Chemical.name.ilike(search_pattern))

    # Order alphabetically for easy scanning
    # This differs from entities like users where chronological order makes more sense
    query = query.order_by(Chemical.name.asc())

    chemicals = query.offset(skip).limit(limit).all()

    return chemicals


@router.get("/{chemical_id}", response_model=ChemicalResponse)
def get_chemical(
        chemical_id: int,
        db: Session = Depends(get_db)
):
    """
    Retrieve a single chemical by ID.
    
    **Future Enhancement:**
    When method relationships are fully implemented, this could accept an
    include parameter to show all methods that use this chemical. This would
    help researchers understand dependencies before modifying or deleting
    a chemical.
    
    Args:
        chemical_id: The chemical's unique identifier
        db: Database session
    
    Returns:
        ChemicalResponse: The requested chemical
    
    Raises:
        HTTPException(404): If chemical not found
    """

    chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()

    if chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    return chemical


@router.post("/", response_model=ChemicalResponse, status_code=status.HTTP_201_CREATED)
def create_chemical(
        chemical: ChemicalCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new chemical.
    
    **Uniqueness Check:**
    Chemical names must be unique to prevent confusion. We check explicitly
    rather than relying on the database constraint because it lets us return
    a clear error message. When a researcher tries to add "Ethanol" but it
    already exists, they get a specific message telling them so, rather than
    a generic integrity error.
    
    **Name Normalization Consideration:**
    In a production system, you might normalize chemical names before checking
    uniqueness - for example, trimming whitespace and standardizing
    capitalization. This would prevent "Ethanol" and "ethanol  " from being
    treated as different chemicals. For now, we rely on clients providing
    consistent formatting, but this is an enhancement area.
    
    Args:
        chemical: Chemical data validated by ChemicalCreate schema
        db: Database session
    
    Returns:
        ChemicalResponse: The created chemical
    
    Raises:
        HTTPException(400): If a chemical with this name already exists
    """

    # Check for existing chemical with the same name
    existing = db.query(Chemical).filter(
        Chemical.name == chemical.name
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A chemical named '{chemical.name}' already exists"
        )

    db_chemical = Chemical(**chemical.model_dump())
    db.add(db_chemical)
    db.commit()
    db.refresh(db_chemical)

    return db_chemical


@router.patch("/{chemical_id}", response_model=ChemicalResponse)
def update_chemical(
        chemical_id: int,
        chemical_update: ChemicalUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a chemical.
    
    **When to Update vs Create New:**
    Updating a chemical's name affects all methods that reference it, which
    could be problematic if methods are documented in papers or reports using
    the old name. In practice, it's often better to create a new chemical
    and update methods to reference it, leaving the old chemical for historical
    accuracy. However, the update capability exists for genuine corrections
    like fixing typos.
    
    Args:
        chemical_id: ID of chemical to update
        chemical_update: Fields to update
        db: Database session
    
    Returns:
        ChemicalResponse: The updated chemical
    
    Raises:
        HTTPException(404): If chemical not found
        HTTPException(400): If name update would create a duplicate
    """

    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()

    if db_chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    update_data = chemical_update.model_dump(exclude_unset=True)

    # Check for name uniqueness if name is being updated
    if 'name' in update_data and update_data['name'] != db_chemical.name:
        existing = db.query(Chemical).filter(
            Chemical.name == update_data['name'],
            Chemical.id != chemical_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"A chemical named '{update_data['name']}' already exists"
            )

    for field, value in update_data.items():
        setattr(db_chemical, field, value)

    db.commit()
    db.refresh(db_chemical)

    return db_chemical


@router.delete("/{chemical_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chemical(
        chemical_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a chemical.
    
    **Foreign Key Protection:**
    If this chemical is referenced in the chemical_method junction table
    (meaning methods use this chemical), the database constraint with
    ON DELETE CASCADE will automatically remove those junction table rows.
    This is appropriate because the junction rows exist purely to connect
    chemicals to methods - if the chemical no longer exists, the connection
    is meaningless.
    
    **Future Enhancement:**
    Before deleting, you could query to see how many methods reference this
    chemical and return a confirmation message like "This will affect 3 methods.
    Are you sure?" This helps prevent accidental deletions of widely-used
    chemicals. The pattern would involve querying the junction table:
    
    count = db.query(chemical_method).filter(
        chemical_method.c.chemical_id == chemical_id
    ).count()
    
    Then returning a 409 Conflict with details if count > 0, requiring a
    force=true parameter to proceed with deletion.
    
    Args:
        chemical_id: ID of chemical to delete
        db: Database session
    
    Returns:
        None (204 No Content)
    
    Raises:
        HTTPException(404): If chemical not found
    """

    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()

    if db_chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    db.delete(db_chemical)
    db.commit()

    return None