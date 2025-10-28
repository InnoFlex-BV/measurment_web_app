"""
User model representing researchers and administrators.

Users conduct experiments and have authentication credentials.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """
    User model for authentication and experiment attribution.
    
    Each user has a unique username and email for authentication.
    Users have roles that determine their permissions (admin, researcher, etc.).
    The is_active flag allows soft-deletion by deactivating accounts.
    """

    # Specify the table name in the database
    __tablename__ = "users"

    # Primary key column - unique identifier for each user
    # autoincrement=True means PostgreSQL generates sequential IDs automatically
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Username for login - must be unique across all users
    # nullable=False means this field is required
    username = Column(String(50), unique=True, nullable=False, index=True)

    # Full name for display in UI
    full_name = Column(String(100), nullable=False)

    # Email for notifications and password resets - must be unique
    email = Column(String(255), unique=True, nullable=False, index=True)

    # Password hash - never store plain passwords
    # This will hold bcrypt or argon2 hashed passwords
    password_hash = Column(String(255), nullable=False)

    # Role determines permissions
    # Default is 'researcher', but can be 'admin', 'viewer', etc.
    role = Column(String(20), nullable=False, default='researcher')

    # Whether this account is currently active
    # Setting to False effectively disables the account without deleting data
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamp tracking when the user account was created
    # server_default uses PostgreSQL's CURRENT_TIMESTAMP function
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Timestamp tracking last modification to user data
    # onupdate=func.now() automatically updates this on any modification
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship to experiments conducted by this user
    # back_populates creates bidirectional relationship
    # When you access user.experiments, SQLAlchemy queries experiments with matching user_id
    experiments = relationship("Experiment", back_populates="user")

    # Relationship to files uploaded by this user
    uploaded_files = relationship("File", back_populates="uploader")

    def __repr__(self):
        """
        String representation for debugging.
        Appears when you print a User instance or view it in a debugger.
        """
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"