"""
Method API router.

Methods represent synthesis procedures for creating catalysts. This router
demonstrates managing many-to-many relationships through junction tables,
specifically the relationship between methods and chemicals.

Architectural patterns demonstrated:
- Managing many-to-many relationships with explicit junction table handling
- Parameterized relationship inclusion for controlling response detail
- Transaction management for operations affecting multiple tables
- Validation of foreign key references before insertion

Future enhancements marked with TODO: include:
- Versioning methods when procedures are modified
- Template methods that can be copied and customized
- Method effectiveness metrics based on catalyst success rates
- Relationship to samples and experiments in later phases
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app.models.catalysts.method import Method, chemical_method
from app.models.catalysts.chemical import Chemical
from app.schemas.catalysts.method import MethodCreate, MethodUpdate, MethodResponse

router = APIRouter(
    prefix="/api/methods",
    tags=["Methods"]
)


@router.get("/", response_model=List[MethodResponse])
def list_methods(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        search: Optional[str] = Query(None, description="Search in method names"),
        include: Optional[str] = Query(None, description="Comma-separated list of relationships to include (e.g., 'chemicals')"),
        db: Session = Depends(get_db)
):
    """
    List all methods with optional filtering, search, and relationship inclusion.
    
    **Relationship Inclusion Pattern:**
    This endpoint introduces the include parameter pattern that will be
    replicated across all entity routers. Clients can request nested data
    by specifying relationship names: ?include=chemicals loads the complete
    Chemical objects rather than just IDs. This pattern scales well because:
    - Adding new relationships never requires new endpoints
    - Clients control the detail level they need
    - Default responses are lightweight, detailed responses are opt-in
    
    The include parameter uses comma separation for multiple relationships.
    When you add more relationships in future phases, the same parameter
    handles them: ?include=chemicals,catalysts,samples
    
    **Eager Loading vs N+1 Queries:**
    When include=chemicals is specified, we use SQLAlchemy's joinedload()
    to fetch related data in a single query with JOINs. Without this, accessing
    method.chemicals for each method would trigger separate queries (the N+1
    problem). With 10 methods, that's 1 query for methods + 10 queries for
    chemicals = 11 total. With joinedload, it's 1 query with JOINs.
    
    Args:
        skip: Pagination offset
        limit: Page size
        is_active: Filter to active or inactive methods only
        search: Text to match in method names
        include: Relationships to populate in response
        db: Database session
    
    Returns:
        List[MethodResponse]: Methods matching criteria, with optional nested data
    """

    query = db.query(Method)

    # Parse include parameter to determine what relationships to load
    # Default to empty set if no relationships requested
    include_rels = set()
    if include:
        # Split on commas and strip whitespace: "chemicals, catalysts" -> ["chemicals", "catalysts"]
        include_rels = {rel.strip() for rel in include.split(',')}

    # Apply eager loading for requested relationships
    # joinedload tells SQLAlchemy to fetch related data using JOINs
    # This happens in a single database query rather than N+1 queries
    if 'chemicals' in include_rels:
        query = query.options(joinedload(Method.chemicals))

    # TODO: Add eager loading for other relationships when implemented
    # if 'catalysts' in include_rels:
    #     query = query.options(joinedload(Method.catalysts))
    # if 'samples' in include_rels:
    #     query = query.options(joinedload(Method.samples))

    # Apply filters
    if is_active is not None:
        query = query.filter(Method.is_active == is_active)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Method.descriptive_name.ilike(search_pattern))

    # Order by name for consistency
    # Methods are reference data, so alphabetical order makes sense
    query = query.order_by(Method.descriptive_name.asc())

    methods = query.offset(skip).limit(limit).all()

    return methods


@router.get("/{method_id}", response_model=MethodResponse)
def get_method(
        method_id: int,
        include: Optional[str] = Query(None, description="Comma-separated list of relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single method by ID with optional relationship inclusion.
    
    This endpoint demonstrates the same include parameter pattern for
    individual resource retrieval. When viewing a method's details, clients
    often want to see what chemicals it uses, so including that relationship
    is common: GET /api/methods/1?include=chemicals
    
    **Future Enhancement - Usage Statistics:**
    TODO: Add a computed field showing how many catalysts were created using
    this method. This would require joining to the catalysts table and counting.
    The pattern would be:
    
    if 'usage_stats' in include_rels:
        method.catalysts_count = db.query(Catalyst).filter(
            Catalyst.method_id == method_id
        ).count()
    
    This kind of derived data helps researchers understand which methods
    are most commonly used and successful.
    
    Args:
        method_id: The method's unique identifier
        include: Relationships to populate
        db: Database session
    
    Returns:
        MethodResponse: The method with optional nested data
    
    Raises:
        HTTPException(404): If method not found
    """

    query = db.query(Method)

    # Parse include parameter
    include_rels = set()
    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

    # Apply eager loading
    if 'chemicals' in include_rels:
        query = query.options(joinedload(Method.chemicals))

    # TODO: Add other relationship loading as implemented in future phases

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
    Create a new method with associated chemicals.
    
    **Managing Junction Table Relationships:**
    Creating a method with chemicals involves three steps in a single transaction:
    1. Validate that all chemical IDs reference existing chemicals
    2. Create the method record
    3. Create junction table rows linking the method to chemicals
    
    SQLAlchemy's relationship system handles step 3 automatically. When you
    assign method.chemicals = [list of Chemical objects], SQLAlchemy creates
    the junction table rows. This is much cleaner than manually inserting into
    the junction table.
    
    **Transaction Safety:**
    All three steps happen in a single database transaction. If chemical
    validation fails or junction table creation fails, the entire operation
    rolls back, leaving the database unchanged. This atomic behavior ensures
    data consistency.
    
    **Foreign Key Validation:**
    We explicitly validate that chemical IDs exist before attempting creation.
    The database would enforce this anyway through foreign key constraints,
    but checking first lets us return a clear error message identifying exactly
    which chemical ID is invalid. This is much better UX than a generic
    constraint violation error.
    
    Args:
        method: Method data including chemical IDs
        db: Database session
    
    Returns:
        MethodResponse: The created method with associated chemicals
    
    Raises:
        HTTPException(400): If any chemical ID doesn't exist
    """

    # Validate that all chemical IDs reference existing chemicals
    # This explicit check provides better error messages than relying on FK constraints
    if method.chemical_ids:
        # Query for all chemicals with IDs in the provided list
        chemicals = db.query(Chemical).filter(
            Chemical.id.in_(method.chemical_ids)
        ).all()

        # If we didn't find all the chemicals, some IDs are invalid
        found_ids = {c.id for c in chemicals}
        provided_ids = set(method.chemical_ids)
        missing_ids = provided_ids - found_ids

        if missing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Chemical IDs not found: {sorted(missing_ids)}"
            )
    else:
        # No chemicals specified, empty list
        chemicals = []

    # Create the method instance
    # Use model_dump(exclude={'chemical_ids'}) to get all fields except chemical_ids
    # chemical_ids is schema-only, not a model field, so we exclude it
    method_data = method.model_dump(exclude={'chemical_ids'})
    db_method = Method(**method_data)

    # Assign chemicals relationship
    # SQLAlchemy will automatically create junction table rows when we commit
    db_method.chemicals = chemicals

    # Commit transaction
    # This creates the method row and junction table rows atomically
    db.add(db_method)
    db.commit()
    db.refresh(db_method)

    return db_method


@router.patch("/{method_id}", response_model=MethodResponse)
def update_method(
        method_id: int,
        method_update: MethodUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a method including its chemical associations.
    
    **Updating Many-to-Many Relationships:**
    When updating the chemicals list, we replace the entire relationship
    rather than trying to compute a diff. This is simpler and more predictable:
    - To add a chemical: include all existing chemical IDs plus the new one
    - To remove a chemical: include all IDs except the one to remove
    - To replace entirely: provide the complete new list
    
    SQLAlchemy handles the junction table updates automatically. When you
    assign method.chemicals to a new list, SQLAlchemy compares it to the
    current state and generates the appropriate INSERT and DELETE statements
    for the junction table.
    
    **Partial Update Pattern:**
    Because chemical_ids is optional in MethodUpdate, clients can update
    the procedure text without affecting the chemicals list, or update the
    chemicals list without providing a new procedure. This flexibility is
    important for good API ergonomics.
    
    TODO: Implement method versioning when procedure is modified
    When a method's procedure changes, it might be valuable to preserve the
    old version for historical catalysts that used it. The pattern would be:
    - Check if procedure field is being updated
    - If so, create a new method row with the updated procedure
    - Mark the old method as inactive but preserve it
    - Update references to point to the new version
    This maintains reproducibility for historical catalysts.
    
    Args:
        method_id: ID of method to update
        method_update: Fields to update, including optional new chemicals list
        db: Database session
    
    Returns:
        MethodResponse: Updated method
    
    Raises:
        HTTPException(404): If method not found
        HTTPException(400): If chemical IDs are invalid
    """

    db_method = db.query(Method).filter(Method.id == method_id).first()

    if db_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    # Get update data, excluding chemical_ids which we handle separately
    update_data = method_update.model_dump(exclude_unset=True, exclude={'chemical_ids'})

    # Update chemical relationships if new list provided
    if method_update.chemical_ids is not None:
        # Validate all chemical IDs exist
        if method_update.chemical_ids:
            chemicals = db.query(Chemical).filter(
                Chemical.id.in_(method_update.chemical_ids)
            ).all()

            found_ids = {c.id for c in chemicals}
            provided_ids = set(method_update.chemical_ids)
            missing_ids = provided_ids - found_ids

            if missing_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Chemical IDs not found: {sorted(missing_ids)}"
                )
        else:
            chemicals = []

        # Replace the chemicals relationship
        # SQLAlchemy will delete old junction rows and insert new ones
        db_method.chemicals = chemicals

    # Apply other field updates
    for field, value in update_data.items():
        setattr(db_method, field, value)

    db.commit()
    db.refresh(db_method)

    return db_method


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_method(
        method_id: int,
        force: bool = Query(False, description="Force delete even if catalysts reference this method"),
        db: Session = Depends(get_db)
):
    """
    Delete a method.
    
    **Soft Delete Pattern:**
    Rather than actually deleting methods that are referenced by catalysts,
    a better pattern is setting is_active=False. This preserves the method
    information for historical catalysts while preventing its use for new
    ones. True deletion is only appropriate for methods that were created
    by mistake and never used.
    
    The force parameter allows true deletion when explicitly requested, but
    the default behavior encourages soft deletion by setting is_active=False
    when catalysts reference the method.
    
    TODO: Implement cascade prevention with helpful error messages
    Before deleting, query how many catalysts use this method:
    
    catalyst_count = db.query(Catalyst).filter(
        Catalyst.method_id == method_id
    ).count()
    
    If count > 0 and not force:
        Return 409 Conflict with message like:
        "This method is used by 5 catalysts. Set is_active=False instead,
        or use force=true to delete anyway."
    
    This prevents accidental deletion of widely-used methods while still
    allowing true deletion when necessary.
    
    Args:
        method_id: ID of method to delete
        force: If true, delete even if catalysts reference it
        db: Database session
    
    Returns:
        None (204 No Content)
    
    Raises:
        HTTPException(404): If method not found
    """

    db_method = db.query(Method).filter(Method.id == method_id).first()

    if db_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    # TODO: Implement the cascade prevention logic described in docstring
    # For now, delete proceeds according to database FK constraints

    # Delete the method
    # The chemical_method junction rows are CASCADE deleted automatically
    # Catalyst foreign keys use SET NULL, so they're preserved but lose method reference
    db.delete(db_method)
    db.commit()

    return None


# Additional endpoint for managing chemicals directly on a method
# This is an alternative API pattern to updating the entire chemicals list

@router.post("/{method_id}/chemicals/{chemical_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_chemical_to_method(
        method_id: int,
        chemical_id: int,
        db: Session = Depends(get_db)
):
    """
    Add a chemical to a method's chemical list.
    
    **Alternative API Pattern:**
    This endpoint provides a more granular way to manage the many-to-many
    relationship. Instead of replacing the entire chemicals list via PATCH,
    clients can add individual chemicals with POST. This is more RESTful
    and easier to use when you just want to add one chemical.
    
    The pattern of having both approaches gives clients flexibility:
    - Use PATCH with complete list for bulk updates
    - Use POST/DELETE on sub-resources for single additions/removals
    
    TODO: Consider adding this pattern to other many-to-many relationships
    When you implement catalyst derivation chains (catalyst_catalyst junction),
    the same pattern would be useful for adding input/output catalysts.
    
    Args:
        method_id: The method to modify
        chemical_id: The chemical to add
        db: Database session
    
    Returns:
        None (204 No Content)
    
    Raises:
        HTTPException(404): If method or chemical not found
        HTTPException(400): If chemical is already in the method's list
    """

    db_method = db.query(Method).filter(Method.id == method_id).first()
    if db_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()
    if db_chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    # Check if chemical is already in the method's list
    if db_chemical in db_method.chemicals:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chemical {chemical_id} is already associated with this method"
        )

    # Add chemical to the relationship
    # SQLAlchemy will insert a junction table row when we commit
    db_method.chemicals.append(db_chemical)
    db.commit()

    return None


@router.delete("/{method_id}/chemicals/{chemical_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_chemical_from_method(
        method_id: int,
        chemical_id: int,
        db: Session = Depends(get_db)
):
    """
    Remove a chemical from a method's chemical list.
    
    This is the counterpart to add_chemical_to_method, providing granular
    control over the many-to-many relationship. Together, these endpoints
    let clients manage the relationship one item at a time rather than
    replacing the entire list.
    
    Args:
        method_id: The method to modify
        chemical_id: The chemical to remove
        db: Database session
    
    Returns:
        None (204 No Content)
    
    Raises:
        HTTPException(404): If method or chemical not found, or if chemical
                          is not associated with this method
    """

    db_method = db.query(Method).filter(Method.id == method_id).first()
    if db_method is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Method with ID {method_id} not found"
        )

    db_chemical = db.query(Chemical).filter(Chemical.id == chemical_id).first()
    if db_chemical is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical with ID {chemical_id} not found"
        )

    # Check if chemical is in the method's list
    if db_chemical not in db_method.chemicals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chemical {chemical_id} is not associated with this method"
        )

    # Remove chemical from the relationship
    # SQLAlchemy will delete the junction table row when we commit
    db_method.chemicals.remove(db_chemical)
    db.commit()

    return None