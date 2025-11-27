"""
Group model representing collections of related experiments.

Groups allow organizing experiments into logical collections for
comparison and analysis. A group might represent a parameter study,
a catalyst comparison, or experiments for a specific publication.

Database Schema (from 01_init.sql):
-----------------------------------
create table groups (
    id serial primary key,
    name varchar(255) not null,
    purpose varchar(255),
    discussed_in integer references files(id) on delete cascade,
    conclusion text,
    method text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table group_experiment (
    group_id integer not null references groups(id) on delete cascade,
    experiment_id integer not null references experiments(id) on delete cascade,
    primary key(group_id, experiment_id)
);

Design Notes:
-------------
- Groups can reference a document file (discussed_in)
- method field describes the experimental approach for the group
- conclusion summarizes findings from the grouped experiments
- ON DELETE CASCADE on discussed_in means deleting the file deletes the group
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# Junction table for group-experiment relationship
group_experiment = Table(
    'group_experiment',
    Base.metadata,
    Column('group_id', Integer, ForeignKey('groups.id', ondelete='CASCADE'), primary_key=True),
    Column('experiment_id', Integer, ForeignKey('experiments.id', ondelete='CASCADE'), primary_key=True)
)


class Group(Base):
    """
    Group model for organizing related experiments.
    
    Groups provide a way to collect experiments that should be
    analyzed together. Common use cases:
    
    Parameter Studies:
    - Temperature series: experiments at different temperatures
    - Power series: experiments at different power levels
    - Flow rate studies: varying gas flow rates
    
    Catalyst Comparisons:
    - Same conditions, different catalysts
    - Benchmark against commercial catalysts
    
    Publication Groups:
    - Experiments that will appear in a paper
    - Link to the manuscript via discussed_in
    
    The group stores:
    - purpose: Why these experiments are grouped
    - method: Experimental methodology for the group
    - conclusion: Summary of findings
    - discussed_in: Reference to a document file (paper, report)
    """

    __tablename__ = "groups"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Group name
    # Should be descriptive and unique enough to identify
    # Examples: "Temperature Study TiO2-Pt", "Catalyst Comparison 2024-Q1"
    name = Column(String(255), nullable=False)

    # Purpose of this grouping
    # Why are these experiments being analyzed together?
    purpose = Column(String(255), nullable=True)

    # Reference to document discussing this group
    # Typically a paper, report, or thesis chapter
    # CASCADE delete means deleting the file deletes this group!
    discussed_in_id = Column(
        'discussed_in',
        Integer,
        ForeignKey('files.id', ondelete='CASCADE'),
        nullable=True
    )

    # Conclusion from analyzing this group of experiments
    # Summary of key findings
    conclusion = Column(Text, nullable=True)

    # Experimental method description for this group
    # Common methodology across grouped experiments
    method = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # =========================================================================
    # Relationships
    # =========================================================================

    # Many-to-one: Document file discussing this group
    discussed_in_file = relationship(
        "File",
        foreign_keys=[discussed_in_id],
        doc="Document file discussing this experiment group"
    )

    # Many-to-many: Experiments in this group
    experiments = relationship(
        "Experiment",
        secondary=group_experiment,
        back_populates="groups",
        doc="Experiments in this group"
    )

    def __repr__(self):
        """String representation for debugging."""
        return f"<Group(id={self.id}, name='{self.name}')>"

    @property
    def experiment_count(self) -> int:
        """Number of experiments in this group."""
        return len(self.experiments) if self.experiments else 0

    @property
    def has_document(self) -> bool:
        """Check if a document is linked to this group."""
        return self.discussed_in_id is not None

    @property
    def has_conclusion(self) -> bool:
        """Check if conclusion has been recorded."""
        return bool(self.conclusion)