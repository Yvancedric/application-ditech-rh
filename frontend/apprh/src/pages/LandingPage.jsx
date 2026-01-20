import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { motion } from 'framer-motion';
import { Building2, Zap, Clock, Shield, Briefcase } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.6,
            },
        },
    };

    const stats = [
        { value: '100%', label: 'Automatisation', icon: Zap },
        { value: '24/7', label: 'Disponibilité', icon: Clock },
        { value: 'Sécurisé', label: 'Données protégées', icon: Shield },
    ];

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background"></div>
                <div className="hero-overlay"></div>
                
                <motion.div
                    className="hero-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="hero-text">
                        <motion.h1
                            className="hero-title"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            Gestion RH
                        </motion.h1>
                        <motion.h2
                            className="hero-subtitle"
                            variants={itemVariants}
                        >
                            Technologie Digitale
                        </motion.h2>
                        <motion.p className="hero-description" variants={itemVariants}>
                            Système de Gestion des Ressources Humaines moderne et complet
                            pour optimiser la gestion de votre personnel en Côte d'Ivoire.
                            Simplifiez vos processus RH avec notre plateforme intuitive et performante.
                        </motion.p>
                        
                        <motion.div variants={itemVariants} className="hero-stats">
                            {stats.map((stat, index) => {
                                const IconComponent = stat.icon;
                                return (
                                    <div key={index} className="stat-item">
                                        {IconComponent && (
                                            <div className="stat-icon-wrapper">
                                                <IconComponent size={24} />
                                            </div>
                                        )}
                                        <div className="stat-value">{stat.value}</div>
                                        <div className="stat-label">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </motion.div>

                        <motion.div variants={itemVariants} className="hero-cta">
                            <Button
                                label="Gerez Les employées"
                                icon="pi pi-sign-in"
                                iconPos="right"
                                className="hero-button"
                                onClick={() => navigate('/login')}
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hero-image-container"
                        variants={itemVariants}
                    >
                        <div className="hero-image">
                            <div className="image-placeholder">
                                <div className="solution-icon-wrapper">
                                    <Briefcase size={80} />
                                </div>
                                <p>Solution RH Professionnelle</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage;