"""
User API router.

This router provides endpoints for managing research personnel who work with
catalysts, samples, and experiments. The endpoints follow REST conventions
and demonstrate patterns that are replicated across all entity routers.

The design philosophy emphasizes:
- Thin router layer that delegates to service functions for complex logic
- Consistent error handling with informative messages
- Clear separation between HTTP concerns and business logic
- Extensibility for future relationship management

Future enhancements will add:
- Relationships to entities the user has worked on (catalysts, experiments)
- Activity history showing the user's contributions
- Permission and role management when authentication is implemented
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.core.user import User
from app.schemas.core.user import UserCreate, UserUpdate, UserResponse

# Create the router instance with configuration
# The prefix is prepended to all route paths defined in this router
# Tags group endpoints in the API documentation for better organization
# The tags will appear in the Swagger UI sidebar, making it easy to find
# all user-related endpoints together
router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


@router.get("/", response_model=List[UserResponse])
def list_users(
        skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
        limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        search: Optional[str] = Query(None, description="Search in username, full_name, or email"),
        db: Session = Depends(get_db)
):
    """
    List all users with optional filtering and pagination.
    
    This endpoint demonstrates the standard pattern for collection endpoints
    that will be replicated across all entity routers. The pattern includes:
    - Pagination through skip and limit parameters
    - Filtering through optional query parameters
    - Search capability across multiple text fields
    - Ordered results for consistent pagination
    
    The Query() function provides parameter validation and documentation.
    The ge (greater than or equal) and le (less than or equal) constraints
    ensure parameters are within valid ranges. The description appears in
    the API documentation to help clients understand parameter usage.
    
    **Pagination Strategy:**
    We use offset-based pagination (skip/limit) rather than cursor-based
    pagination because it's simpler and sufficient for your use case.
    Cursor-based pagination is more efficient for very large datasets but
    adds complexity that isn't justified for a laboratory system with
    hundreds or thousands of users, not millions.
    
    **Future Enhancement:**
    When you implement user tracking tables (user_catalyst, user_experiment),
    you could add a parameter like contribution_count_min to filter users
    by how many entities they've worked on. This kind of sophisticated
    filtering is easy to add later because the pattern is established.
    
    Args:
        skip: Number of records to skip (for pagination offset)
        limit: Maximum number of records to return (page size)
        is_active: Filter to only active or inactive users
        search: Search text to match against username, full_name, or email
        db: Database session injected by FastAPI's dependency system
    
    Returns:
        List[UserResponse]: List of users matching the criteria
    """

    # Start building the query
    # Using the query builder pattern allows adding filters conditionally
    # This is more maintainable than building SQL strings manually
    query = db.query(User)

    # Apply filters conditionally based on provided parameters
    # Each filter is only added if the parameter was provided by the client
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    # Search across multiple text fields using SQL OR
    # The ilike operator does case-insensitive pattern matching
    # The % wildcards match any characters before/after the search term
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_pattern)) |
            (User.full_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )

    # Order by created_at descending so newest users appear first
    # Consistent ordering is important for pagination because it ensures
    # that the same users don't appear in multiple pages if data changes
    query = query.order_by(User.created_at.desc())

    # Apply pagination and fetch results
    # offset() skips records, limit() caps the count
    # all() executes the query and returns a list of model instances
    users = query.offset(skip).limit(limit).all()

    # FastAPI automatically serializes the users to JSON using UserResponse schema
    # The response_model in the decorator tells FastAPI to validate the response
    # and include the schema in the API documentation
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Retrieve a single user by ID.
    
    This endpoint demonstrates the standard pattern for retrieving individual
    resources. The pattern includes:
    - Path parameter for the resource identifier
    - 404 error with clear message if resource doesn't exist
    - Single query to fetch the resource
    
    **Path Parameters vs Query Parameters:**
    We use a path parameter (/{user_id}) rather than a query parameter
    (?id=123) because the user ID identifies a specific resource. REST
    conventions use path parameters for resource identifiers and query
    parameters for filtering, searching, or controlling output.
    
    **Future Enhancement:**
    When user tracking tables exist, you could add a query parameter like
    ?include=catalysts,experiments to populate relationships showing what
    entities this user has worked on. The pattern would match how the
    catalyst router handles relationship inclusion.
    
    Args:
        user_id: The unique identifier of the user to retrieve
        db: Database session
    
    Returns:
        UserResponse: The user with the specified ID
    
    Raises:
        HTTPException(404): If no user exists with the given ID
    """

    # Query for the specific user
    # first() returns the first matching result or None if no match
    user = db.query(User).filter(User.id == user_id).first()

    # Raise 404 if the user doesn't exist
    # HTTPException is FastAPI's way of returning HTTP error responses
    # The status_code determines the HTTP status returned to the client
    # The detail is the error message that appears in the response body
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
        user: UserCreate,
        db: Session = Depends(get_db)
):
    """
    Create a new user.
    
    This endpoint demonstrates the standard pattern for creating resources.
    The pattern includes:
    - Request body validated against a Create schema
    - Checking for uniqueness constraints before attempting database insert
    - Returning 201 Created status with the created resource
    - Handling database errors gracefully
    
    **Why Check Uniqueness First:**
    We explicitly check if a user with the same username or email exists
    before attempting to insert. While the database's unique constraints
    would prevent duplicate inserts anyway, checking first lets us return
    a clear, specific error message rather than a generic database error.
    This makes debugging easier for API clients.
    
    **Status Code 201:**
    REST conventions use 201 Created for successful resource creation,
    not 200 OK. The 201 status signals to clients that a new resource
    was created and includes that resource in the response body. Some
    APIs also include a Location header with the URL of the new resource,
    which you could add as a future enhancement.
    
    Args:
        user: User data validated against UserCreate schema
        db: Database session
    
    Returns:
        UserResponse: The newly created user with generated ID and timestamps
    
    Raises:
        HTTPException(400): If a user with the same username or email exists
    """

    # Check if a user with this username already exists
    # Querying first lets us return a specific error message
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()

    if existing_user:
        # Determine which field caused the conflict for a clear error message
        if existing_user.username == user.username:
            conflict_field = "username"
        else:
            conflict_field = "email"

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with this {conflict_field} already exists"
        )

    # Create a new User model instance from the validated Pydantic schema
    # The model_dump() method converts the Pydantic schema to a dictionary
    # The ** operator unpacks the dictionary into keyword arguments
    # This is equivalent to User(username=user.username, email=user.email, ...)
    db_user = User(**user.model_dump())

    # Add the instance to the session (stages the insert)
    db.add(db_user)

    # Commit the transaction (executes the INSERT statement)
    # If any error occurs during commit, SQLAlchemy raises an exception
    # FastAPI's default error handler will catch it and return a 500 error
    db.commit()

    # Refresh the instance to get database-generated values
    # After commit, db_user.id and db_user.created_at contain the values
    # that PostgreSQL generated, which we need to include in the response
    db.refresh(db_user)

    return db_user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
        user_id: int,
        user_update: UserUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a user (partial update).
    
    This endpoint demonstrates the standard pattern for updating resources.
    The pattern includes:
    - PATCH method for partial updates (vs PUT for full replacement)
    - Update schema with all optional fields
    - Only updating fields that were provided in the request
    - Checking for unique constraint violations before committing
    
    **PATCH vs PUT:**
    We use PATCH because clients typically want to update specific fields
    without providing all fields. With PATCH, you can send just
    {"email": "new@email.com"} to update only the email. With PUT, REST
    conventions require sending the complete resource representation.
    
    **exclude_unset=True:**
    This is the critical parameter that enables partial updates. When
    converting the UserUpdate schema to a dictionary, exclude_unset=True
    means only fields that were explicitly provided in the request are
    included. Fields that weren't in the request body are excluded entirely,
    so they don't overwrite existing values with None.
    
    **Future Enhancement:**
    For user accounts in a system with authentication, you'd add logic here
    to ensure users can only update their own accounts (or require admin
    privileges to update others). The pattern would use FastAPI dependencies
    to inject the current authenticated user.
    
    Args:
        user_id: ID of the user to update
        user_update: Fields to update (only provided fields are changed)
        db: Database session
    
    Returns:
        UserResponse: The updated user
    
    Raises:
        HTTPException(404): If user not found
        HTTPException(400): If email update would violate uniqueness
    """

    # Find the user to update
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Get the update data, excluding fields that weren't provided
    # exclude_unset=True means only fields in the request are in this dict
    update_data = user_update.model_dump(exclude_unset=True)

    # If email is being updated, check it's not already used by another user
    # We allow updating to the same email (no change) but not to another user's email
    if 'email' in update_data and update_data['email'] != db_user.email:
        existing_user = db.query(User).filter(
            User.email == update_data['email'],
            User.id != user_id  # Exclude the user being updated
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )

    # Apply each field update
    # setattr dynamically sets object attributes: setattr(obj, 'email', 'new@email.com')
    # is equivalent to obj.email = 'new@email.com'
    for field, value in update_data.items():
        setattr(db_user, field, value)

    # Commit the changes
    # The database trigger automatically updates the updated_at timestamp
    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete a user.
    
    This endpoint demonstrates the standard pattern for deleting resources.
    The pattern includes:
    - DELETE method with resource ID in path
    - 204 No Content status on success (no response body)
    - Handling foreign key constraint violations gracefully
    
    **204 No Content:**
    REST conventions use 204 for successful deletions because there's
    nothing meaningful to return. The resource is gone, so returning its
    data would be confusing. Some APIs return 200 with a success message,
    but 204 is more semantically correct and saves bandwidth.
    
    **Foreign Key Constraints:**
    If the user is referenced by other entities (like uploaded files),
    the database foreign key constraint determines what happens. Your schema
    uses ON DELETE SET NULL for uploaded_by, which means deleting the user
    sets those foreign keys to null rather than preventing deletion or
    cascading the deletion to files. When user tracking tables are added,
    they'll likely use ON DELETE CASCADE to clean up tracking records.
    
    **Soft Delete Alternative:**
    An alternative pattern is "soft deletion" where you set is_active=False
    instead of actually deleting the record. This preserves historical data
    and audit trails. For a production system, soft deletion is often
    preferable, but true deletion is simpler for development and testing.
    
    Args:
        user_id: ID of the user to delete
        db: Database session
    
    Returns:
        None (204 No Content has no response body)
    
    Raises:
        HTTPException(404): If user not found
    """

    # Find the user to delete
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    # Delete the user
    # This queues the DELETE statement in the transaction
    db.delete(db_user)

    # Commit the transaction
    # If foreign key constraints prevent deletion, this raises an exception
    db.commit()

    # Return None explicitly
    # 204 responses have no body, so we return None
    # FastAPI understands this and generates the appropriate empty response
    return None