import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Users, Calendar, DollarSign, BarChart3, User, Lock, UserX } from "lucide-react";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const isValid =
      credentials.username.trim() !== "" && credentials.password.trim() !== "";
    setIsFormValid(isValid);
  }, [credentials.username, credentials.password]);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setCredentials({
      ...credentials,
      [name]: name === "rememberMe" ? checked : value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid || loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await login(credentials.username, credentials.password);
      
      if (result.success) {
        // Rediriger vers le dashboard après connexion réussie
        navigate("/dashboard");
      } else {
        setError(result.error || "Erreur de connexion");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Partie gauche - Formulaire */}
        <div className="login-form-section">
          <div className="login-box">
            <div className="login-header">
              <div className="logo">
                <h1 style={{color:"#1e3a8a"}}>Gestion RH</h1>
              </div>
              <h2 style={{color:"#1e3a8a"}}>Connexion</h2>
            </div>

            <Card className="login-card">
              <div className="card-content">
                {error && (
                  <div className="login-error" role="alert">
                    <UserX className="login-error-icon" size={20} strokeWidth={2} />
                    <span className="login-error-text">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="username">Nom d'utilisateur</label>
                    <div className="input-wrapper">
                      <div className="input-icon">
                        <User size={18} />
                      </div>
                      <InputText
                        id="username"
                        name="username"
                        value={credentials.username}
                        onChange={handleInputChange}
                        placeholder="Entrez votre nom d'utilisateur"
                        className="form-input with-icon"
                        required
                        disabled={loading}
                        autoComplete="username"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Mot de passe</label>
                    <div className="password-wrapper">
                      <div className="input-icon">
                        <Lock size={18} />
                      </div>
                      <InputText
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={handleInputChange}
                        placeholder="Entrez votre mot de passe"
                        className="form-input password-input with-icon"
                        required
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={togglePasswordVisibility}
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Cacher le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <div className="remember-me">
                      <Checkbox
                        inputId="rememberMe"
                        name="rememberMe"
                        checked={credentials.rememberMe}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <label htmlFor="rememberMe">Se souvenir de moi</label>
                    </div>
                    <button
                      type="button"
                      className="forgot-password-link"
                      onClick={() => navigate("/forgot-password")}
                      disabled={loading}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    label={loading ? "Connexion en cours..." : "Se connecter"}
                    icon={loading ? "pi pi-spin pi-spinner" : "pi pi-sign-in"}
                    className="login-button"
                    disabled={!isFormValid || loading}
                  />

                  <div className="home-link-container">
                    <Link to="/" className="home-link">
                      Retour à la page d'accueil
                    </Link>
                  </div>
                </form>

                <div className="login-footer">
                  <p>Système de Gestion RH DITECH - Réservé uniquement pour la RH</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Partie droite - Image RH Ivoirienne */}
        <div className="login-image-section">
          <div className="image-overlay"></div>
          <div className="image-content">
            <div className="rh-icon-container">
              <Users size={80} />
            </div>
            <h2>Gestion des Ressources Humaines</h2>
            <p>Solution moderne et performante pour la gestion de votre personnel en Côte d'Ivoire</p>
            <div className="features-list">
              <div className="feature-item">
                <User size={24} className="feature-icon" />
                <span>Gestion complète du personnel</span>
              </div>
              <div className="feature-item">
                <Calendar size={24} className="feature-icon" />
                <span>Suivi des présences et absences</span>
              </div>
              <div className="feature-item">
                <DollarSign size={24} className="feature-icon" />
                <span>Gestion de la paie automatisée</span>
              </div>
              <div className="feature-item">
                <BarChart3 size={24} className="feature-icon" />
                <span>Tableaux de bord en temps réel</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
