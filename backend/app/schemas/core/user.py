"""
Pydantic schemas for User entity.

These schemas define how user data is validated when received from API clients
and how it's serialized when returned in API responses. Users in this system
represent research personnel who work with catalysts and experiments, not
authentication users (which would be handled separately in a production system).

The schemas follow the standard pattern:
- UserBase: Common fields shared across operations
- UserCreate: Fields needed to create a new user
- UserUpdate: Fields that can be modified (all optional for partial updates)
- UserResponse: Complete user data as returned by the API
"""

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """
    Base schema containing fields common to multiple user schemas.
    
    This schema is never used directly in API endpoints but serves as a
    parent class for other user schemas, avoiding repetition of field
    definitions. Any field that appears in both creation and response
    schemas should be defined here.
    """

    # EmailStr is a special Pydantic type that validates email format
    # It checks that the string contains an @ symbol, has a domain part,
    # and generally looks like a valid email address
    # The Field(...) function marks this as required (no default value)
    email: EmailStr = Field(
        ...,
        description="User's email address for communication and identification",
        examples=["jane.smith@university.edu"]
    )

    # Full name should be the researcher's complete name as they prefer to be called
    # The min_length ensures the field isn't just whitespace
    # The max_length matches the database column constraint
    full_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's full name for display",
        examples=["Dr. Jane Smith", "John Doe"]
    )


class UserCreate(UserBase):
    """
    Schema for creating a new user.
    
    Inherits email and full_name from UserBase and adds fields specific
    to user creation. The username is required at creation and must be
    unique, which is enforced at the database level through a unique constraint.
    
    Note: This schema does not include password or authentication fields
    because this system focuses on research data management. In a production
    system with authentication, you would add password fields here.
    """

    # Username should be a short identifier, typically matching network logins
    # The pattern constraint ensures usernames contain only safe characters
    # that won't cause issues in URLs or database queries
    username: str = Field(
        ...,
        min_length=3,
        max_length=255,
        pattern="^[a-zA-Z0-9_-]+$",
        description="Unique username for identification",
        examples=["jsmith", "jane_smith"]
    )

    # is_active is optional at creation with a sensible default
    # This allows creating inactive users if needed (for pre-registration)
    # but defaults to True so most users are active immediately
    is_active: Optional[bool] = Field(
        default=True,
        description="Whether the user account is active"
    )


class UserUpdate(BaseModel):
    """
    Schema for updating an existing user.
    
    All fields are optional because you might want to update just one field
    without providing all the others. This enables partial updates where
    the API applies only the fields present in the request.
    
    Fields set to None in the request mean "don't change this field,"
    not "set this field to null." The router logic handles this by using
    exclude_unset=True when converting the schema to a dictionary.
    """

    # Optional indicates the field might not be present or might be None
    # Each field has a default of None, meaning if not provided, no update occurs
    email: Optional[EmailStr] = Field(
        None,
        description="New email address"
    )

    full_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Updated full name"
    )

    # Note: username is not included in the update schema because usernames
    # shouldn't change after account creation. They serve as stable identifiers
    # that other systems might reference. If you needed to change usernames,
    # you'd add it here, but it's often better to create a new account.

    is_active: Optional[bool] = Field(
        None,
        description="Whether to activate or deactivate the account"
    )


class UserResponse(UserBase):
    """
    Schema for user data returned by the API.
    
    This includes all fields that should be visible to API clients,
    including generated fields like id and timestamps. These fields
    only exist after the database creates the record, so they appear
    in the response schema but not in the create schema.
    """

    # These fields are generated by the database and only appear in responses
    id: int = Field(
        ...,
        description="Unique user identifier",
        examples=[1, 42, 103]
    )

    username: str = Field(
        ...,
        description="Username for identification",
        examples=["jsmith"]
    )

    is_active: bool = Field(
        ...,
        description="Whether the account is currently active"
    )

    # Timestamps use Python's datetime type
    # FastAPI automatically serializes datetime objects to ISO 8601 strings
    # in JSON responses, so clients receive something like "2024-01-15T14:30:00Z"
    created_at: datetime = Field(
        ...,
        description="When the account was created"
    )

    updated_at: datetime = Field(
        ...,
        description="When the account was last modified"
    )

    # ConfigDict replaces the old Config class in Pydantic v2
    # from_attributes=True is the critical setting that allows creating
    # this schema from SQLAlchemy model instances
    #
    # Without this, Pydantic expects dictionary data like {"id": 1, "email": "..."}
    # With this, Pydantic can read from object attributes like user.id, user.email
    # This is essential because your routes return SQLAlchemy query results
    model_config = ConfigDict(
        from_attributes=True,
        # json_schema_extra provides additional metadata for API documentation
        json_schema_extra={
            "examples": [
                {
                    "id": 1,
                    "username": "jsmith",
                    "email": "jane.smith@university.edu",
                    "full_name": "Dr. Jane Smith",
                    "is_active": True,
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z"
                }
            ]
        }
    )