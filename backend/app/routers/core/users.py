"""
User API router.

Users represent research personnel who work with the system. This router
provides CRUD operations and contribution statistics.

Endpoint Summary:
- GET    /api/users/           List with filtering
- POST   /api/users/           Create new user
- GET    /api/users/{id}       Get details
- PATCH  /api/users/{id}       Update
- DELETE /api/users/{id}       Delete (deactivation preferred)
- GET    /api/users/{id}/stats Get contribution statistics
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models.core.user import User
from app.schemas.core.user import (
    UserCreate, UserUpdate, UserResponse
)

router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


@router.get("/", response_model=List[UserResponse])
def list_users(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None, description="Search in username, name, email"),
        is_active: Optional[bool] = Query(None, description="Filter by active status"),
        include: Optional[str] = Query(
            None,
            description="Relationships: catalysts,samples,characterizations,"
                        "observations,experiments"
        ),
        db: Session = Depends(get_db)
):
    """
    List users with filtering and relationship inclusion.
    """

    query = db.query(User)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_pattern)) |
            (User.full_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern))
        )

    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalysts' in include_rels:
            query = query.options(joinedload(User.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(User.samples))
        if 'characterizations' in include_rels:
            query = query.options(joinedload(User.characterizations))
        if 'observations' in include_rels:
            query = query.options(joinedload(User.observations))
        if 'experiments' in include_rels:
            query = query.options(joinedload(User.experiments))

    query = query.order_by(User.full_name)

    return query.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
        user_id: int,
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single user by ID.
    """

    query = db.query(User)

    if include:
        include_rels = {rel.strip() for rel in include.split(',')}

        if 'catalysts' in include_rels:
            query = query.options(joinedload(User.catalysts))
        if 'samples' in include_rels:
            query = query.options(joinedload(User.samples))
        if 'characterizations' in include_rels:
            query = query.options(joinedload(User.characterizations))
        if 'observations' in include_rels:
            query = query.options(joinedload(User.observations))
        if 'experiments' in include_rels:
            query = query.options(joinedload(User.experiments))

    user = query.filter(User.id == user_id).first()

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
    
    Username and email must be unique.
    """

    # Check for duplicate username
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user.username}' already exists"
        )

    # Check for duplicate email
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email '{user.email}' already exists"
        )

    db_user = User(**user.model_dump())
    db.add(db_user)

    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )

    return db_user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
        user_id: int,
        user_update: UserUpdate,
        db: Session = Depends(get_db)
):
    """
    Update a user with partial data.
    """

    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    update_data = user_update.model_dump(exclude_unset=True)

    # Check uniqueness constraints
    if 'username' in update_data:
        existing = db.query(User).filter(
            User.username == update_data['username'],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{update_data['username']}' already exists"
            )

    if 'email' in update_data:
        existing = db.query(User).filter(
            User.email == update_data['email'],
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{update_data['email']}' already exists"
            )

    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)

    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
        user_id: int,
        force: bool = Query(False, description="Force delete even if has contributions"),
        db: Session = Depends(get_db)
):
    """
    Delete a user.
    
    Deactivation (PATCH with is_active=false) is preferred over deletion
    to preserve audit history. Fails if user has contributions unless
    force=True.
    """

    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    if not force and db_user.total_contributions > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User has {db_user.total_contributions} contributions. "
                   "Use force=true to delete anyway, or consider deactivating "
                   "(PATCH with is_active=false) to preserve audit history."
        )

    db.delete(db_user)
    db.commit()

    return None


@router.get("/{user_id}/stats")
def get_user_stats(
        user_id: int,
        db: Session = Depends(get_db)
):
    """
    Get detailed contribution statistics for a user.
    
    Returns counts of each type of contribution.
    """

    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    return {
        "user_id": user_id,
        "username": db_user.username,
        "full_name": db_user.full_name,
        "catalysts": db_user.catalyst_count,
        "samples": db_user.sample_count,
        "characterizations": db_user.characterization_count,
        "experiments": db_user.experiment_count,
        "total_contributions": db_user.total_contributions
    }
