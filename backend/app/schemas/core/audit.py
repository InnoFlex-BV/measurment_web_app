"""
Audit tracking schemas for user contribution records.

These schemas represent the user junction table records that track which
users have worked on which entities. Unlike UserMethod which has notes,
these simpler junction tables only track who and when.

Schema Types:
- UserContribution: Generic record showing user-entity relationship
- EntityContributors: List of users who worked on an entity
- UserActivity: List of entities a user has worked on
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List, Any


class UserContributionBase(BaseModel):
    """
    Base schema for a user contribution record.
    
    Represents a single record from any user junction table
    (user_catalyst, user_sample, etc.)
    """

    user_id: int = Field(..., description="User who made the contribution")
    changed_at: datetime = Field(..., description="When the contribution was recorded")


class UserContributionResponse(UserContributionBase):
    """
    Response schema for user contribution with optional user details.
    """

    # Optional nested user details
    user: Optional[Any] = Field(
        default=None,
        description="User details (included when requested)"
    )

    model_config = ConfigDict(from_attributes=True)


class CatalystContribution(UserContributionBase):
    """User contribution record for a catalyst."""

    catalyst_id: int = Field(..., description="Catalyst worked on")

    model_config = ConfigDict(from_attributes=True)


class SampleContribution(UserContributionBase):
    """User contribution record for a sample."""

    sample_id: int = Field(..., description="Sample worked on")

    model_config = ConfigDict(from_attributes=True)


class CharacterizationContribution(UserContributionBase):
    """User contribution record for a characterization."""

    characterization_id: int = Field(..., description="Characterization performed")

    model_config = ConfigDict(from_attributes=True)


class ObservationContribution(UserContributionBase):
    """User contribution record for an observation."""

    observation_id: int = Field(..., description="Observation recorded")

    model_config = ConfigDict(from_attributes=True)


class ExperimentContribution(UserContributionBase):
    """User contribution record for an experiment."""

    experiment_id: int = Field(..., description="Experiment participated in")

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Aggregated Views
# =============================================================================

class EntityContributors(BaseModel):
    """
    List of users who have contributed to an entity.
    """

    entity_type: str = Field(..., description="Type of entity (catalyst, sample, etc.)")
    entity_id: int = Field(..., description="Entity ID")
    contributors: List[UserContributionResponse] = Field(
        default=[],
        description="List of user contributions"
    )
    total_contributors: int = Field(default=0, description="Total unique contributors")


class UserActivitySummary(BaseModel):
    """
    Summary of a user's activity across all entity types.
    """

    user_id: int = Field(..., description="User ID")
    catalysts_count: int = Field(default=0, description="Catalysts worked on")
    samples_count: int = Field(default=0, description="Samples worked on")
    characterizations_count: int = Field(default=0, description="Characterizations performed")
    observations_count: int = Field(default=0, description="Observations recorded")
    experiments_count: int = Field(default=0, description="Experiments participated in")
    method_changes_count: int = Field(default=0, description="Method modifications")
    total_contributions: int = Field(default=0, description="Total contributions")

    # Optional: most recent activity
    last_activity: Optional[datetime] = Field(
        default=None,
        description="Timestamp of most recent contribution"
    )