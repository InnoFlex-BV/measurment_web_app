"""
Experiment API router.

Experiments are the core data collection entities, recording conditions
and results of catalytic testing. This router supports polymorphic handling
of Plasma, Photocatalysis, and Misc experiment subtypes.

The experiment_type field determines which subtype is created/returned:
- 'plasma': Plasma-catalysis experiments
- 'photocatalysis': Light-driven catalytic reactions
- 'misc': Miscellaneous experiment types

Endpoint Summary:
- GET    /api/experiments/                List experiments (all types)
- POST   /api/experiments/                Create experiment (type from body)
- GET    /api/experiments/{id}            Get experiment details
- PATCH  /api/experiments/{id}            Update experiment
- DELETE /api/experiments/{id}            Delete experiment

Relationship endpoints:
- POST   /api/experiments/{id}/samples/{sample_id}           Add sample
- DELETE /api/experiments/{id}/samples/{sample_id}           Remove sample
- POST   /api/experiments/{id}/groups/{group_id}             Add to group
- DELETE /api/experiments/{id}/groups/{group_id}             Remove from group
- POST   /api/experiments/{id}/users/{user_id}               Add user
- DELETE /api/experiments/{id}/users/{user_id}               Remove user

Type-specific endpoints:
- GET    /api/experiments/plasma/         List plasma experiments
- GET    /api/experiments/photocatalysis/ List photocatalysis experiments
- GET    /api/experiments/misc/           List misc experiments
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from sqlalchemy import insert
from typing import List, Optional, Union

from app.database import get_db
from app.models.experiments.experiment import (
    Experiment, Plasma, Photocatalysis, Misc,
    user_experiment
)
from app.models.experiments.reactor import Reactor
from app.models.experiments.analyzer import Analyzer
from app.models.experiments.waveform import Waveform
from app.models.experiments.processed import Processed
from app.models.catalysts.sample import Sample
from app.models.reference.group import Group
from app.models.reference.contaminant import Contaminant, contaminant_experiment
from app.models.reference.carrier import Carrier, carrier_experiment
from app.models.core.user import User
from app.models.core.file import File
from app.schemas.experiments.experiment import (
    ExperimentResponse,
    PlasmaCreate, PlasmaUpdate, PlasmaResponse,
    PhotocatalysisCreate, PhotocatalysisUpdate, PhotocatalysisResponse,
    MiscCreate, MiscUpdate, MiscResponse,
    ExperimentCreateUnion, ExperimentResponseUnion
)

router = APIRouter(
    prefix="/api/experiments",
    tags=["Experiments"]
)


# =============================================================================
# Helper Functions
# =============================================================================

def _apply_experiment_includes(query, include: Optional[str]):
    """Apply eager loading based on include parameter."""
    if not include:
        return query

    include_rels = {rel.strip() for rel in include.split(',')}

    if 'reactor' in include_rels:
        query = query.options(joinedload(Experiment.reactor))
    if 'analyzer' in include_rels:
        query = query.options(joinedload(Experiment.analyzer))
    if 'samples' in include_rels:
        query = query.options(joinedload(Experiment.samples))
    if 'contaminants' in include_rels:
        query = query.options(joinedload(Experiment.contaminants))
    if 'carriers' in include_rels:
        query = query.options(joinedload(Experiment.carriers))
    if 'groups' in include_rels:
        query = query.options(joinedload(Experiment.groups))
    if 'users' in include_rels:
        query = query.options(joinedload(Experiment.users))
    if 'raw_data_file' in include_rels:
        query = query.options(joinedload(Experiment.raw_data_file))
    if 'processed_results' in include_rels:
        query = query.options(joinedload(Experiment.processed_results))

    return query


def _validate_experiment_references(db: Session, data: dict):
    """Validate foreign key references for experiment creation/update."""
    errors = []

    if 'reactor_id' in data and data['reactor_id']:
        if not db.query(Reactor).filter(Reactor.id == data['reactor_id']).first():
            errors.append(f"Reactor with ID {data['reactor_id']} not found")

    if 'analyzer_id' in data and data['analyzer_id']:
        if not db.query(Analyzer).filter(Analyzer.id == data['analyzer_id']).first():
            errors.append(f"Analyzer with ID {data['analyzer_id']} not found")

    if 'raw_data_id' in data and data['raw_data_id']:
        if not db.query(File).filter(File.id == data['raw_data_id']).first():
            errors.append(f"File with ID {data['raw_data_id']} not found")

    if 'processed_table_id' in data and data['processed_table_id']:
        if not db.query(Processed).filter(Processed.id == data['processed_table_id']).first():
            errors.append(f"Processed with ID {data['processed_table_id']} not found")

    # Plasma-specific validation
    if 'driving_waveform_id' in data and data['driving_waveform_id']:
        if not db.query(Waveform).filter(Waveform.id == data['driving_waveform_id']).first():
            errors.append(f"Waveform with ID {data['driving_waveform_id']} not found")

    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(errors)
        )


def _handle_experiment_relationships(db: Session, experiment, data: dict):
    """Handle many-to-many relationship assignments."""

    # Handle samples
    if 'sample_ids' in data and data['sample_ids'] is not None:
        samples = db.query(Sample).filter(Sample.id.in_(data['sample_ids'])).all()
        if len(samples) != len(data['sample_ids']):
            found_ids = {s.id for s in samples}
            missing = set(data['sample_ids']) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Samples not found: {missing}"
            )
        experiment.samples = samples

    # Handle groups
    if 'group_ids' in data and data['group_ids'] is not None:
        groups = db.query(Group).filter(Group.id.in_(data['group_ids'])).all()
        if len(groups) != len(data['group_ids']):
            found_ids = {g.id for g in groups}
            missing = set(data['group_ids']) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Groups not found: {missing}"
            )
        experiment.groups = groups

    # Handle users
    if 'user_ids' in data and data['user_ids'] is not None:
        users = db.query(User).filter(User.id.in_(data['user_ids'])).all()
        if len(users) != len(data['user_ids']):
            found_ids = {u.id for u in users}
            missing = set(data['user_ids']) - found_ids
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Users not found: {missing}"
            )
        experiment.users = users

    # Handle contaminants with ppm (requires direct junction table manipulation)
    if 'contaminant_data' in data and data['contaminant_data'] is not None:
        # Clear existing
        db.execute(
            contaminant_experiment.delete().where(
                contaminant_experiment.c.experiment_id == experiment.id
            )
        )

        # Add new with ppm values
        for item in data['contaminant_data']:
            contaminant_id = item.get('id')
            ppm = item.get('ppm')

            if not db.query(Contaminant).filter(Contaminant.id == contaminant_id).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Contaminant with ID {contaminant_id} not found"
                )

            db.execute(
                insert(contaminant_experiment).values(
                    experiment_id=experiment.id,
                    contaminant_id=contaminant_id,
                    ppm=ppm
                )
            )

    # Handle carriers with ratio
    if 'carrier_data' in data and data['carrier_data'] is not None:
        # Clear existing
        db.execute(
            carrier_experiment.delete().where(
                carrier_experiment.c.experiment_id == experiment.id
            )
        )

        # Add new with ratio values
        for item in data['carrier_data']:
            carrier_id = item.get('id')
            ratio = item.get('ratio')

            if not db.query(Carrier).filter(Carrier.id == carrier_id).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Carrier with ID {carrier_id} not found"
                )

            db.execute(
                insert(carrier_experiment).values(
                    experiment_id=experiment.id,
                    carrier_id=carrier_id,
                    ratio=ratio
                )
            )


# =============================================================================
# List and Search
# =============================================================================

@router.get("/", response_model=List[ExperimentResponseUnion])
def list_experiments(
        skip: int = Query(0, ge=0, description="Pagination offset"),
        limit: int = Query(100, ge=1, le=1000, description="Page size"),
        search: Optional[str] = Query(None, description="Search in name and purpose"),
        experiment_type: Optional[str] = Query(
            None,
            description="Filter by type: plasma, photocatalysis, misc"
        ),
        reactor_id: Optional[int] = Query(None, description="Filter by reactor"),
        analyzer_id: Optional[int] = Query(None, description="Filter by analyzer"),
        include: Optional[str] = Query(
            None,
            description="Relationships: reactor,analyzer,samples,contaminants,"
                        "carriers,groups,users,raw_data_file,processed_results"
        ),
        db: Session = Depends(get_db)
):
    """
    List experiments with optional filtering.
    
    Returns polymorphic results with type-specific fields.
    """

    query = db.query(Experiment)

    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Experiment.name.ilike(search_pattern)) |
            (Experiment.purpose.ilike(search_pattern))
        )

    if experiment_type:
        if experiment_type not in ('plasma', 'photocatalysis', 'misc'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid experiment_type: {experiment_type}"
            )
        query = query.filter(Experiment.experiment_type == experiment_type)

    if reactor_id is not None:
        query = query.filter(Experiment.reactor_id == reactor_id)

    if analyzer_id is not None:
        query = query.filter(Experiment.analyzer_id == analyzer_id)

    # Apply eager loading
    query = _apply_experiment_includes(query, include)

    # Order by creation date (newest first)
    query = query.order_by(Experiment.created_at.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/plasma/", response_model=List[PlasmaResponse])
def list_plasma_experiments(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None),
        waveform_id: Optional[int] = Query(None, description="Filter by waveform"),
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """List plasma experiments only."""

    query = db.query(Plasma)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Plasma.name.ilike(search_pattern)) |
            (Plasma.purpose.ilike(search_pattern))
        )

    if waveform_id is not None:
        query = query.filter(Plasma.driving_waveform_id == waveform_id)

    query = _apply_experiment_includes(query, include)

    if include and 'driving_waveform' in include:
        query = query.options(joinedload(Plasma.driving_waveform))

    query = query.order_by(Plasma.created_at.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/photocatalysis/", response_model=List[PhotocatalysisResponse])
def list_photocatalysis_experiments(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None),
        min_wavelength: Optional[float] = Query(None),
        max_wavelength: Optional[float] = Query(None),
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """List photocatalysis experiments only."""

    query = db.query(Photocatalysis)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Photocatalysis.name.ilike(search_pattern)) |
            (Photocatalysis.purpose.ilike(search_pattern))
        )

    if min_wavelength is not None:
        query = query.filter(Photocatalysis.wavelength >= min_wavelength)

    if max_wavelength is not None:
        query = query.filter(Photocatalysis.wavelength <= max_wavelength)

    query = _apply_experiment_includes(query, include)
    query = query.order_by(Photocatalysis.created_at.desc())

    return query.offset(skip).limit(limit).all()


@router.get("/misc/", response_model=List[MiscResponse])
def list_misc_experiments(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        search: Optional[str] = Query(None),
        include: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    """List misc experiments only."""

    query = db.query(Misc)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Misc.name.ilike(search_pattern)) |
            (Misc.purpose.ilike(search_pattern)) |
            (Misc.description.ilike(search_pattern))
        )

    query = _apply_experiment_includes(query, include)
    query = query.order_by(Misc.created_at.desc())

    return query.offset(skip).limit(limit).all()


# =============================================================================
# CRUD Operations
# =============================================================================

@router.get("/{experiment_id}", response_model=ExperimentResponseUnion)
def get_experiment(
        experiment_id: int,
        include: Optional[str] = Query(None, description="Relationships to include"),
        db: Session = Depends(get_db)
):
    """
    Retrieve a single experiment by ID.
    
    Returns the full polymorphic type with all type-specific fields.
    """

    query = db.query(Experiment)
    query = _apply_experiment_includes(query, include)

    # Add plasma-specific includes
    if include and 'driving_waveform' in include:
        query = query.options(joinedload(Plasma.driving_waveform))

    experiment = query.filter(Experiment.id == experiment_id).first()

    if experiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    return experiment


@router.post("/", response_model=ExperimentResponseUnion, status_code=status.HTTP_201_CREATED)
def create_experiment(
        experiment: ExperimentCreateUnion,
        db: Session = Depends(get_db)
):
    """
    Create a new experiment.
    
    The experiment_type field determines which subtype is created.
    """

    data = experiment.model_dump()
    experiment_type = data.pop('experiment_type')

    # Extract relationship data
    sample_ids = data.pop('sample_ids', None)
    contaminant_data = data.pop('contaminant_data', None)
    carrier_data = data.pop('carrier_data', None)
    group_ids = data.pop('group_ids', None)
    user_ids = data.pop('user_ids', None)

    # Validate references
    _validate_experiment_references(db, data)

    # Create the appropriate subtype
    if experiment_type == 'plasma':
        db_experiment = Plasma(**data, experiment_type='plasma')
    elif experiment_type == 'photocatalysis':
        db_experiment = Photocatalysis(**data, experiment_type='photocatalysis')
    elif experiment_type == 'misc':
        db_experiment = Misc(**data, experiment_type='misc')
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid experiment_type: {experiment_type}"
        )

    db.add(db_experiment)
    db.flush()  # Get the ID before handling relationships

    # Handle relationships
    rel_data = {
        'sample_ids': sample_ids,
        'contaminant_data': contaminant_data,
        'carrier_data': carrier_data,
        'group_ids': group_ids,
        'user_ids': user_ids,
    }
    _handle_experiment_relationships(db, db_experiment, rel_data)

    try:
        db.commit()
        db.refresh(db_experiment)
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database integrity error: {str(e)}"
        )

    return db_experiment


@router.patch("/{experiment_id}", response_model=ExperimentResponseUnion)
def update_experiment(
        experiment_id: int,
        experiment_update: Union[PlasmaUpdate, PhotocatalysisUpdate, MiscUpdate],
        db: Session = Depends(get_db)
):
    """
    Update an experiment.
    
    The experiment_type cannot be changed after creation.
    """

    db_experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()

    if db_experiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    data = experiment_update.model_dump(exclude_unset=True)

    # Extract relationship data
    sample_ids = data.pop('sample_ids', None)
    contaminant_data = data.pop('contaminant_data', None)
    carrier_data = data.pop('carrier_data', None)
    group_ids = data.pop('group_ids', None)
    user_ids = data.pop('user_ids', None)

    # Validate references
    _validate_experiment_references(db, data)

    # Update scalar fields
    for field, value in data.items():
        setattr(db_experiment, field, value)

    # Handle relationships if provided
    rel_data = {}
    if sample_ids is not None:
        rel_data['sample_ids'] = sample_ids
    if contaminant_data is not None:
        rel_data['contaminant_data'] = contaminant_data
    if carrier_data is not None:
        rel_data['carrier_data'] = carrier_data
    if group_ids is not None:
        rel_data['group_ids'] = group_ids
    if user_ids is not None:
        rel_data['user_ids'] = user_ids

    if rel_data:
        _handle_experiment_relationships(db, db_experiment, rel_data)

    db.commit()
    db.refresh(db_experiment)

    return db_experiment


@router.delete("/{experiment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experiment(
        experiment_id: int,
        db: Session = Depends(get_db)
):
    """
    Delete an experiment.
    
    Also removes all junction table entries (CASCADE).
    """

    db_experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()

    if db_experiment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    db.delete(db_experiment)
    db.commit()

    return None


# =============================================================================
# Relationship Management Endpoints
# =============================================================================

@router.post("/{experiment_id}/samples/{sample_id}", status_code=status.HTTP_201_CREATED)
def add_sample_to_experiment(
        experiment_id: int,
        sample_id: int,
        db: Session = Depends(get_db)
):
    """Add a sample to an experiment."""

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    if sample in experiment.samples:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sample already linked to this experiment"
        )

    experiment.samples.append(sample)
    db.commit()

    return {"message": f"Sample {sample_id} added to experiment {experiment_id}"}


@router.delete("/{experiment_id}/samples/{sample_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_sample_from_experiment(
        experiment_id: int,
        sample_id: int,
        db: Session = Depends(get_db)
):
    """Remove a sample from an experiment."""

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sample with ID {sample_id} not found"
        )

    if sample not in experiment.samples:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sample not linked to this experiment"
        )

    experiment.samples.remove(sample)
    db.commit()

    return None


@router.post("/{experiment_id}/groups/{group_id}", status_code=status.HTTP_201_CREATED)
def add_experiment_to_group(
        experiment_id: int,
        group_id: int,
        db: Session = Depends(get_db)
):
    """Add an experiment to a group."""

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    if group in experiment.groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Experiment already in this group"
        )

    experiment.groups.append(group)
    db.commit()

    return {"message": f"Experiment {experiment_id} added to group {group_id}"}


@router.delete("/{experiment_id}/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_experiment_from_group(
        experiment_id: int,
        group_id: int,
        db: Session = Depends(get_db)
):
    """Remove an experiment from a group."""

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group with ID {group_id} not found"
        )

    if group not in experiment.groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Experiment not in this group"
        )

    experiment.groups.remove(group)
    db.commit()

    return None


@router.post("/{experiment_id}/users/{user_id}", status_code=status.HTTP_201_CREATED)
def add_user_to_experiment(
        experiment_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """Add a user to an experiment (audit tracking)."""

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    if user in experiment.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already linked to this experiment"
        )

    experiment.users.append(user)
    db.commit()

    return {"message": f"User {user_id} added to experiment {experiment_id}"}


@router.delete("/{experiment_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user_from_experiment(
        experiment_id: int,
        user_id: int,
        db: Session = Depends(get_db)
):
    """Remove a user from an experiment."""

    experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not experiment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment with ID {experiment_id} not found"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )

    if user not in experiment.users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not linked to this experiment"
        )

    experiment.users.remove(user)
    db.commit()

    return None