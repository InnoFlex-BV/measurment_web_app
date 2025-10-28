/**
 * Home page component.
 *
 * Landing page that provides an overview and quick links to main features.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
    return (
        <div className="home-page">
            <section className="hero">
                <h1>Laboratory Data Management System</h1>
                <p className="hero-subtitle">
                    Streamline your chemistry experiments with organized data collection and analysis
                </p>
            </section>
            <section className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <Link to="/experiments/new" className="action-card">
                        <span className="action-icon">➕</span>
                        <h4>Create New Experiment</h4>
                        <p>Start recording a new laboratory experiment</p>
                    </Link>

                    <Link to="/experiments" className="action-card">
                        <span className="action-icon">📋</span>
                        <h4>View All Experiments</h4>
                        <p>Browse and search your experiment database</p>
                    </Link>

                    <Link to="/experiment-types" className="action-card">
                        <span className="action-icon">⚙️</span>
                        <h4>Configure Types</h4>
                        <p>Manage experiment type categories</p>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default HomePage;