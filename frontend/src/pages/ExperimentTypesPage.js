/**
 * Experiment Types Management Page
 *
 * Lists experiment types with ability to add new ones.
 */

import React, { useState, useEffect } from 'react';
import { experimentTypesAPI } from '../services/api';
import './ExperimentTypesPage.css';

function ExperimentTypesPage() {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newType, setNewType] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            const data = await experimentTypesAPI.getAll({ include_inactive: true });
            setTypes(data);
        } catch (err) {
            setError('Failed to load experiment types');
        } finally {
            setLoading(false);
        }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        try {
            await experimentTypesAPI.create(newType);
            setNewType({ name: '', description: '' });
            setShowAddForm(false);
            fetchTypes();
        } catch (err) {
            alert('Failed to create experiment type');
        }
    };

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }
    
    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <div className="experiment-types-page">
            <div className="page-header">
                <h1>Experiment Types</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                >
                    {showAddForm ? 'Cancel' : 'Add Type'}
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleAddType} className="add-type-form">
                    <input
                        type="text"
                        placeholder="Type name"
                        value={newType.name}
                        onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={newType.description}
                        onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <button type="submit" className="btn btn-primary">Add</button>
                </form>
            )}

            <div className="types-grid">
                {types.map(type => (
                    <div key={type.id} className="type-card">
                        <h3>{type.name}</h3>
                        {type.description && <p>{type.description}</p>}
                        <span className={`active-badge ${type.is_active ? 'active' : 'inactive'}`}>
              {type.is_active ? 'Active' : 'Inactive'}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ExperimentTypesPage;