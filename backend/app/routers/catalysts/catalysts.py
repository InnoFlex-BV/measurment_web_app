"""
Catalyst API router.

Catalysts are the central research artifacts with complex relationships to
methods, other catalysts (derivation chains), and future entities like
characterizations and experiments. This router demonstrates the most
sophisticated patterns in Phase One.

Architectural patterns demonstrated:
- Validating multiple foreign key references before creation
- Managing self-referential many-to-many relationships
- Complex include parameter handling for multiple relationships
- Business logic validation (yield vs remaining amount)
- Computed fields for inventory status

TODO: Phase Two enhancements:
- Add samples relationship inclusion
- Add characterizations relationship to show analytical data
- Add observations relationship for synthesis notes
- Implement inventory tracking when material is consumed
- Add search by chemical composition when that data is available

TODO: Phase Three enhancements:
- Link to experiments that tested this catalyst
- Performance metrics aggregated from experiment results
- Comparison tools for similar catalysts

TODO: Advanced features:
- Batch operations for updating multiple catalysts
- CSV import/export for bulk data management
- Genealogy visualization for catalyst derivation chains
- QR code generation for physical sample labels
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models.catalysts.catalyst import Catalyst, catalyst_catalyst
from app.models.catalysts.method import Method
from app.schemas.catalysts.catalyst import CatalystCreate, CatalystUpdate, CatalystResponse

from datetime import datetime

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
        include: Optional[str] = Query(None, description="Relationships to include: method,input_catalysts,output_catalysts"),
        db: Session = Depends(get_db)
):
    """
    List all catalysts with filtering, search, and relationship inclusion.
    
    **Complex Filtering:**
    This endpoint demonstrates sophisticated filtering capabilities that
    combine multiple criteria. You can filter by method, depletion status,
    and search text simultaneously. This is important for catalysts because
    researchers might want to find "all non-depleted platinum catalysts
    created using sol-gel methods" which requires combining three filters.
    
    **Self-Referential Relationship Inclusion:**
    The include parameter supports input_catalysts and output_catalysts,
    which are the two sides of the catalyst derivation relationship. This
    is complex because:
    - Including input_catalysts loads catalysts that were inputs to create these
    - Including output_catalysts loads catalysts created from these as inputs
    - Both relationships point to the same Catalyst table (self-referential)
    
    SQLAlchemy's joinedload handles this through the primaryjoin and
    secondaryjoin conditions defined in the Catalyst model.
    
    **Depletion Status:**
    The depleted filter uses the computed is_depleted property from the model,
    but we need to filter at the database level for performance. We check
    remaining_amount <= 0.0001 (near zero accounting for floating point)
    rather than calling the property in Python.
    
    TODO: Add sorting options beyond chronological
    Useful sorts would include:
    - Alphabetical by name
    - By remaining amount (find which catalysts are running low)
    - By creation date (default)
    - By method name
    
    Args:
        skip: Pagination offset
        limit: Page size
        search: Text to match in catalyst names
        method_id: Filter to catalysts created with specific method
        depleted: True for depleted catalysts, False for non-depleted, None for all
        include: Comma-separated relationships to populate
        db: Database session
    
    Returns:
        List[CatalystResponse]: Catalysts matching criteria with optional nested data
    """

    query = db.query(Catalyst)

    # Parse include parameter
    include_rels = set()
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

    # Apply eager loading for relationships
    # Each relationship requires appropriate joinedload configuration
    if 'method' in include_rels:
        query = query.options(joinedload(Catalyst.method))

    if 'input_catalysts' in include_rels:
        query = query.options(joinedload(Catalyst.input_catalysts))

    if 'output_catalysts' in include_rels:
        query = query.options(joinedload(Catalyst.output_catalysts))

    # TODO: Add eager loading for Phase Two relationships
    # if 'samples' in include_rels:
    #     query = query.options(joinedload(Catalyst.samples))
    # if 'characterizations' in include_rels:
    #     query = query.options(joinedload(Catalyst.characterizations))
    # if 'observations' in include_rels:
    #     query = query.options(joinedload(Catalyst.observations))

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Catalyst.name.ilike(search_pattern))

    if method_id is not None:
        query = query.filter(Catalyst.method_id == method_id)

    if depleted is not None:
        if depleted:
            # Filter to depleted catalysts (remaining amount near zero)
            query = query.filter(Catalyst.remaining_amount <= 0.0001)
        else:
            # Filter to non-depleted catalysts
            query = query.filter(Catalyst.remaining_amount > 0.0001)

    # Order by creation date descending (newest first)
    query = query.order_by(Catalyst.created_at.desc())

    catalysts = query.offset(skip).limit(limit).all()

    return catalysts


@router.get("/{catalyst_id}", response_model=CatalystResponse)
def get_catalyst(
        catalyst_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single catalyst by ID with optional relationship inclusion.
    
    When viewing a catalyst's details, researchers typically want to see:
    - The method used to create it (include=method)
    - What catalysts it was derived from (include=input_catalysts)
    - What catalysts were created from it (include=output_catalysts)
    - Characterization results (include=characterizations, Phase Two)
    - Experimental performance (include=experiments, Phase Three)
    
    Supporting all of these through a single include parameter creates a
    flexible API that serves multiple use cases without proliferating endpoints.
    
    TODO: Add computed fields for enhanced detail view
    Additional useful information not in the database:
    - usage_percentage: calculated in the model but could be included
    - time_since_creation: days since the catalyst was synthesized
    - samples_count: number of samples created from this catalyst
    - experiments_count: number of experiments using this catalyst
    
    These could be added to the response conditionally based on include=stats
    
    Args:
        catalyst_id: The catalyst's unique identifier
        include: Relationships to populate
        db: Database session
    
    Returns:
        CatalystResponse: The catalyst with optional nested data
    
    Raises:
        HTTPException(404): If catalyst not found
    """

    query = db.query(Catalyst)

    # Parse and apply eager loading
    include_rels = set()
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

    if 'method' in include_rels:
        query = query.options(joinedload(Catalyst.method))

    if 'input_catalysts' in include_rels:
        query = query.options(joinedload(Catalyst.input_catalysts))

    if 'output_catalysts' in include_rels:
        query = query.options(joinedload(Catalyst.output_catalysts))

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
    Create a new catalyst with method and input catalyst associations.
    
    **Multi-Step Validation:**
    Creating a catalyst requires validating:
    1. The method ID references an existing, active method
    2. All input catalyst IDs reference existing catalysts
    3. Business rules like remaining_amount <= yield_amount
    
    Pydantic handles #3 through the field_validator in the schema.
    This endpoint handles #1 and #2 explicitly before attempting creation.
    
    **Self-Referential Relationship:**
    The input_catalyst_ids create rows in the catalyst_catalyst junction
    table with this catalyst as the output and the specified catalysts as
    inputs. This records the derivation chain showing how catalysts evolve
    through modifications.
    
    TODO: Implement atomic inventory reduction for input catalysts
    When a catalyst is created from input catalysts, you might want to
    automatically reduce the remaining_amount of those input catalysts
    to track material consumption. The pattern would be:
    
    for input_catalyst in input_catalysts:
        # Reduce by some fraction or specific amount
        input_catalyst.remaining_amount -= consumed_amount
        if input_catalyst.remaining_amount < 0:
            raise ValidationError("Insufficient material in input catalyst")
    
    This requires additional schema fields for specifying how much of each
    input was consumed.
    
    Args:
        catalyst: Catalyst data including foreign keys
        db: Database session
    
    Returns:
        CatalystResponse: The created catalyst
    
    Raises:
        HTTPException(400): If method_id or input_catalyst_ids are invalid
    """

    # Validate method exists and is active if specified
    if catalyst.method_id is not None:
        method = db.query(Method).filter(
            Method.id == catalyst.method_id,
            Method.is_active == True
        ).first()

        if method is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Method with ID {catalyst.method_id} not found or is inactive"
            )

    # Validate all input catalyst IDs if specified
    input_catalysts = []
    if catalyst.input_catalyst_ids:
        input_catalysts = db.query(Catalyst).filter(
            Catalyst.id.in_(catalyst.input_catalyst_ids)
        ).all()

        found_ids = {c.id for c in input_catalysts}
        provided_ids = set(catalyst.input_catalyst_ids)
        missing_ids = provided_ids - found_ids

        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Input catalyst IDs not found: {sorted(missing_ids)}"
            )

    # Create catalyst instance
    catalyst_data = catalyst.model_dump(exclude={'input_catalyst_ids'})
    db_catalyst = Catalyst(**catalyst_data)

    # Assign input catalysts relationship
    # This creates catalyst_catalyst junction table rows automatically
    db_catalyst.input_catalysts = input_catalysts

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
    Update a catalyst including its method and input catalyst associations.
    
    **Common Update Scenarios:**
    The most frequent updates to catalysts are:
    - Reducing remaining_amount as material is consumed
    - Updating storage_location when material is moved
    - Adding notes about observations or handling
    
    Less common but supported updates include changing the method reference
    (for corrections) or modifying the input catalysts list.
    
    **Business Logic Validation:**
    The Pydantic validator ensures remaining_amount doesn't exceed yield_amount,
    but we also need to validate the relationship between old and new values.
    If you're reducing remaining_amount, the new value should be less than
    the old value (you can't magically create material). However, we allow
    increases to support corrections when the original amount was recorded
    incorrectly.
    
    TODO: Implement material consumption tracking
    When reducing remaining_amount, record where the material went:
    - Was it used to create a sample? Link to the sample.
    - Was it consumed in experiments? Link to experiments.
    - Was it lost or contaminated? Record in notes.
    
    This creates a complete audit trail of material flow.
    
    Args:
        catalyst_id: ID of catalyst to update
        catalyst_update: Fields to update
        db: Database session
    
    Returns:
        CatalystResponse: Updated catalyst
    
    Raises:
        HTTPException(404): If catalyst not found
        HTTPException(400): If method_id or input_catalyst_ids invalid
    """

    db_catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()

    if db_catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    # Validate method if being updated
    if catalyst_update.method_id is not None:
        method = db.query(Method).filter(
            Method.id == catalyst_update.method_id
        ).first()

        if method is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Method with ID {catalyst_update.method_id} not found"
            )

    # Update input catalysts relationship if specified
    if catalyst_update.input_catalyst_ids is not None:
        if catalyst_update.input_catalyst_ids:
            input_catalysts = db.query(Catalyst).filter(
                Catalyst.id.in_(catalyst_update.input_catalyst_ids)
            ).all()

            found_ids = {c.id for c in input_catalysts}
            provided_ids = set(catalyst_update.input_catalyst_ids)
            missing_ids = provided_ids - found_ids

            if missing_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Input catalyst IDs not found: {sorted(missing_ids)}"
                )
        else:
            input_catalysts = []

        db_catalyst.input_catalysts = input_catalysts

    # Apply other field updates
    update_data = catalyst_update.model_dump(
        exclude_unset=True,
        exclude={'input_catalyst_ids'}
    )

    for field, value in update_data.items():
        setattr(db_catalyst, field, value)

    db.commit()
    db.refresh(db_catalyst)

    return db_catalyst


@router.delete("/{catalyst_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_catalyst(
        catalyst_id: int,
        force: bool = Query(False, description="Force delete even if samples or experiments reference it"),
        db: Session = Depends(get_db)
):
    """
    Delete a catalyst.
    
    **Cascade Considerations:**
    Deleting a catalyst has implications for related entities:
    - Samples created from this catalyst (Phase Two)
    - Experiments that tested this catalyst (Phase Three)
    - Characterizations of this catalyst (Phase Two)
    - Observations about this catalyst (Phase Two)
    - Other catalysts that used this as input (catalyst_catalyst)
    
    Your database schema handles these with a mix of CASCADE, SET NULL, and
    RESTRICT behaviors. The catalyst_catalyst junction uses CASCADE, meaning
    derivation links are removed. Samples and experiments likely use SET NULL
    or RESTRICT to preserve data integrity.
    
    **Soft Delete Recommendation:**
    For research data, soft deletion (adding a deleted_at timestamp or
    is_deleted flag) is often preferable to true deletion. This preserves
    the historical record while removing the catalyst from normal views.
    
    TODO: Implement comprehensive cascade prevention
    Before deleting, check all relationships:
    
    samples_count = db.query(Sample).filter(Sample.catalyst_id == catalyst_id).count()
    experiments_count = ...query experiments...
    characterizations_count = ...
    
    if any_count > 0 and not force:
        return detailed error message listing all dependencies
    
    This prevents accidental deletion of catalysts that are central to
    research documentation.
    
    Args:
        catalyst_id: ID of catalyst to delete
        force: Allow deletion despite dependencies
        db: Database session
    
    Returns:
        None (204 No Content)
    
    Raises:
        HTTPException(404): If catalyst not found
    """

    db_catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()

    if db_catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    # TODO: Implement the comprehensive dependency checking described above

    db.delete(db_catalyst)
    db.commit()

    return None


# Additional specialized endpoint for inventory management

@router.patch("/{catalyst_id}/consume", response_model=CatalystResponse)
def consume_catalyst_material(
        catalyst_id: int,
        amount: Decimal = Query(..., gt=0, description="Amount to consume from remaining material"),
        notes: Optional[str] = Query(None, description="Notes about what consumed the material"),
        db: Session = Depends(get_db)
):
    """
    Reduce a catalyst's remaining amount (consume material).
    
    **Specialized Operation Pattern:**
    This endpoint provides a more semantic API for a common operation. Instead
    of clients needing to:
    1. GET the catalyst to see current remaining_amount
    2. Calculate new_amount = current_amount - consumed_amount
    3. PATCH with {remaining_amount: new_amount}
    
    They can simply POST the amount consumed. This is more intuitive and
    prevents race conditions where two clients consume material simultaneously
    and one's update overwrites the other's.
    
    **Atomic Operation:**
    The database-level calculation (remaining_amount = remaining_amount - amount)
    is atomic and safe for concurrent access. Even if multiple requests
    consume material simultaneously, the math works out correctly.
    
    TODO: Link consumption to samples or experiments
    Add parameters like sample_id or experiment_id to record what consumed
    the material. This creates a complete audit trail showing where each
    catalyst's material was used.
    
    Args:
        catalyst_id: ID of catalyst to consume from
        amount: Amount to subtract from remaining_amount
        notes: Optional explanation of what consumed the material
        db: Database session
    
    Returns:
        CatalystResponse: Updated catalyst with reduced remaining_amount
    
    Raises:
        HTTPException(404): If catalyst not found
        HTTPException(400): If insufficient material remains
    """

    db_catalyst = db.query(Catalyst).filter(Catalyst.id == catalyst_id).first()

    if db_catalyst is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catalyst with ID {catalyst_id} not found"
        )

    # Check sufficient material exists
    if db_catalyst.remaining_amount < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient material. Remaining: {db_catalyst.remaining_amount}, Requested: {amount}"
        )

    # Reduce remaining amount
    db_catalyst.remaining_amount -= amount

    # Append to notes if provided
    if notes:
        timestamp_note = f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] Consumed {amount}: {notes}"
        if db_catalyst.notes:
            db_catalyst.notes += timestamp_note
        else:
            db_catalyst.notes = timestamp_note.strip()

    db.commit()
    db.refresh(db_catalyst)

    return db_catalyst