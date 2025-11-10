create table users (
    id serial primary key,
    username varchar(255) unique not null,
    full_name varchar(100) not null,
    email varchar(255) unique not null,
    is_active boolean not null default true,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table files (
    id serial primary key,
    filename varchar(255) not null,
    mime_type varchar(255) not null,
    storage_path varchar(500) not null,
    description text,
    uploaded_by integer references users(id) on delete set null,
    created_at timestamp with time zone default current_timestamp not null,
    file_size bigint not null,
    checksum varchar(255) not null,
    is_deleted boolean not null default false
);

create table reactor (
     id serial primary key,
     description text,
     volume numeric(10,4),
     updated_at timestamp with time zone default current_timestamp not null,
     created_at timestamp with time zone default current_timestamp not null
);

create table processed (
    id serial primary key,
    dre numeric(10,4),
    ey numeric(10,4)
);

create table analyzers (
    id serial primary key,
    name varchar(255) not null,
    analyzer_type varchar(20) not null check (
       analyzer_type in ('ftir', 'oes')
       ),
    description text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table catalysts (
    id serial primary key,
    name varchar(255) not null,
    method_id integer references methods(id) on delete set null,
    yield numeric(8,4) not null check (yield >= 0),
    remaining_amount numeric(8,4) not null check (remaining_amount >= 0),
    storage_location varchar(255) not null,
    notes text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table supports (
    id serial primary key,
    descriptive_name varchar(255) not null unique,
    description text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
    
);

create table methods (
    id serial primary key,
    descriptive_name varchar(255) not null,
    procedure text not null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null,
    is_active boolean not null default true
    
);

create table samples (
    id serial primary key,
    name varchar(255),
    catalyst_id integer references catalysts(id) on delete set null,
    support_id integer references supports(id) on delete set null,
    method_id integer references methods(id) on delete set null,
    yield numeric(8,4) not null check (yield >= 0),
    remaining_amount numeric(8,4) not null check (remaining_amount >= 0),
    storage_location varchar(255) not null,
    notes text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
    
);

-- index on email for fast login lookups
-- indexes dramatically speed up where clauses on indexed columns
-- the unique constraint already creates an index, but being explicit is clear
create index idx_users_email on users(email);

-- index on username for user search functionality
create index idx_users_username on users(username);

create table chemicals (
    id serial primary key,
    name varchar(255) not null unique,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table chemical_method (
    method_id integer not null references methods(id) on delete cascade,
    chemical_id integer not null references chemicals(id) on delete cascade,
    primary key(method_id, chemical_id)
);

create table characterizations (
    id serial primary key,
    type_name varchar(255) not null,
    description text,
    processed_data integer references files(id) on delete set null,
    raw_data integer references files(id) on delete set null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table catalyst_characterization (
    catalyst_id integer not null references catalysts(id) on delete cascade,
    characterization_id integer not null references characterizations(id) on delete cascade,
    primary key(catalyst_id, characterization_id)
);

create table sample_characterization (
    sample_id integer not null references samples(id) on delete cascade,
    characterization_id integer not null references characterizations(id) on delete cascade,
    primary key(sample_id, characterization_id)
);

create table experiments (
    id serial primary key,
    name varchar(255) not null,
    experiment_type varchar(25) not null check ( 
        experiment_type in ('plasma', 'photocatalysis', 'misc')
    ),
    purpose varchar(255) not null,
    reactor_id integer references reactor(id) on delete restrict,
    analyzer_id integer references analyzers(id) on delete restrict,
    raw_data integer references files(id) on delete set null,
    processed_data jsonb,
    processed_table_id integer references processed(id) on delete set null,
    figures integer references files(id) on delete set null,
    discussed_in integer references files(id) on delete set null,
    conclusion text,
    notes text,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table observations (
    id serial primary key,
    objective varchar(255) not null,
    conditions jsonb not null,
    calcination_parameters jsonb not null,
    observations text not null,
    data jsonb not null,
    conclusions text not null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table user_catalyst (
   user_id integer not null references users(id) on delete cascade,
   catalyst_id integer not null references catalysts(id) on delete cascade,
   changed_at timestamp with time zone default current_timestamp not null,
   primary key(user_id, catalyst_id)
);

create table user_sample (
   user_id integer not null references users(id) on delete cascade,
   sample_id integer not null references samples(id) on delete cascade,
   changed_at timestamp with time zone default current_timestamp not null,
   primary key(user_id, sample_id)
);

create table user_experiment (
   user_id integer not null references users(id) on delete cascade,
   experiment_id integer not null references experiments(id) on delete cascade,
   changed_at timestamp with time zone default current_timestamp not null,
   primary key(user_id, experiment_id)
);

create table user_characterization (
   user_id integer not null references users(id) on delete cascade,
   characterization_id integer not null references characterizations(id) on delete cascade,
   changed_at timestamp with time zone default current_timestamp not null,
   primary key(user_id, characterization_id)
);

create table user_observation (
   user_id integer not null references users(id) on delete cascade,
   observation_id integer not null references observations(id) on delete cascade,
   changed_at timestamp with time zone default current_timestamp not null,
   primary key(user_id, observation_id)
);

create table user_method (
   id serial primary key,
   user_id integer not null references users(id) on delete cascade,
   method_id integer not null references methods(id) on delete cascade,
   changed_at timestamp with time zone default current_timestamp not null,
   change_notes text
);

create table catalyst_catalyst (
    input_catalyst_id integer not null references catalysts(id) on delete cascade,
    output_catalyst_id integer not null references catalysts(id) on delete cascade,
    primary key(input_catalyst_id, output_catalyst_id)
);

create table sample_experiment (
    sample_id integer not null references samples(id) on delete cascade,
    experiment_id integer not null references experiments(id) on delete cascade,
    primary key(sample_id, experiment_id)
);

create table catalyst_observation (
    catalyst_id integer not null references catalysts(id) on delete cascade,
    observation_id integer not null references observations(id) on delete cascade,
    primary key(catalyst_id, observation_id)
);

create table sample_observation (
    sample_id integer not null references samples(id) on delete cascade,
    observation_id integer not null references observations(id) on delete cascade,
    primary key(sample_id, observation_id)
);

create table observation_file (
    observation_id integer not null references observations(id) on delete cascade,
    file_id integer not null references files(id) on delete cascade,
    primary key(observation_id, file_id)
);

create table misc (
    experiment_id integer primary key references experiments(id) on delete cascade,
    description text
);

create table plasma (
    experiment_id integer primary key references experiments(id) on delete cascade,
    driving_waveform_id integer references waveforms(id) on delete restrict,
    delivered_power numeric(10,4),
    on_time integer,
    off_time integer,
    dc_voltage integer,
    dc_current integer,
    measured_waveform integer references files(id) on delete set null,
    electrode text,
    reactor_external_temperature integer
);


create table photocatalysis (
    experiment_id integer primary key references experiments(id) on delete cascade,
    wavelength numeric(10,4),
    power numeric(10,4)
);

create table contaminants (
    id serial primary key,
    name varchar(255) not null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table contaminant_experiment (
    contaminant_id integer not null references contaminants(id) on delete cascade,
    experiment_id integer not null references experiments(id) on delete cascade,
    ppm numeric(10,4),
    primary key(contaminant_id, experiment_id)
);

create table carrier_experiment (
    carrier_id integer not null references carriers(id) on delete cascade,
    experiment_id integer not null references experiments(id) on delete cascade,
    ratio numeric(10,4),
    primary key(carrier_id, experiment_id)
);

create table carriers (
    id serial primary key,
    name varchar(255) not null,
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

create table waveforms (
    id serial primary key,
    name varchar(255) not null,
    ac_frequency numeric(10,4),
    ac_duty_cycle numeric(10,4),
    pulsing_frequency numeric(10,4),
    pulsing_duty_cycle numeric(10,4),
    updated_at timestamp with time zone default current_timestamp not null,
    created_at timestamp with time zone default current_timestamp not null
);

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

create table ftir (
   id integer primary key references analyzers(id) on delete cascade,
   path_length numeric(10,4),
   resolution numeric(10,4),
   interval numeric(10,4),
   scans integer
);

create table oes (
   id integer primary key references analyzers(id) on delete cascade,
   integration_time integer,
   scans integer
);

-- function to automatically update the updated_at timestamp
-- this is a postgresql trigger function that runs before update operations
create or replace function update_updated_at_column()
returns trigger as $$
begin
    -- set the updated_at column to the current timestamp
    new.updated_at = current_timestamp;
return new;
end;
$$ language plpgsql;

-- create triggers that automatically update updated_at on any row modification
-- this ensures the timestamp is always accurate without application code managing it

create trigger update_catalysts_updated_at
    before update on catalysts
    for each row
    execute function update_updated_at_column();

create trigger update_supports_updated_at
    before update on supports
    for each row
    execute function update_updated_at_column();

create trigger update_methods_updated_at
    before update on methods
    for each row
    execute function update_updated_at_column();

create trigger update_samples_updated_at
    before update on samples
    for each row
    execute function update_updated_at_column();

create trigger update_users_updated_at
    before update on users
    for each row
    execute function update_updated_at_column();

create trigger update_chemicals_updated_at
    before update on chemicals
    for each row
    execute function update_updated_at_column();

create trigger update_characterizations_updated_at
    before update on characterizations
    for each row
    execute function update_updated_at_column();

create trigger update_experiments_updated_at
    before update on experiments
    for each row
    execute function update_updated_at_column();

create trigger update_reactor_updated_at
    before update on reactor
    for each row
    execute function update_updated_at_column();

create trigger update_contaminants_updated_at
    before update on contaminants
    for each row
    execute function update_updated_at_column();

create trigger update_carriers_updated_at
    before update on carriers
    for each row
    execute function update_updated_at_column();

create trigger update_waveforms_updated_at
    before update on waveforms
    for each row
    execute function update_updated_at_column();

create trigger update_groups_updated_at
    before update on groups
    for each row
    execute function update_updated_at_column();

create trigger update_analyzers_updated_at
    before update on analyzers
    for each row
    execute function update_updated_at_column();

create trigger update_observations_updated_at
    before update on observations
    for each row
    execute function update_updated_at_column();

-- insert some initial data for testing
insert into users (username, full_name, email) values 
    ('admin', 'admin', 'admin@lab.local');