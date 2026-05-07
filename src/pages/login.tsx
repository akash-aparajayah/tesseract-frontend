import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/login.css";
import logo from "../assets/logos1.png";
import { loginUser, forgotPasswordApi } from "../services/authApi";
import { FormState, Errors } from "../types/login.type";
import { useToast } from "../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Loader from "../components/common/Loader";

export default function Login() {
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>("");
  const [logoError, setLogoError] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const validate = (): Errors => {
    const newErrors: Errors = {};
    if (!form.email) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await loginUser(form);

      if (res?.data?.success) {
        const { accessToken, refreshToken } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        showToast("Login successful 🎉", "success");
        navigate("/dashboard");
      } else {
        showToast(res?.data?.message || "Login failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Login failed. Try again!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      showToast("Please enter your email address", "error");
      return;
    }

    setForgotLoading(true);

    try {
      await forgotPasswordApi({ email: forgotEmail });
      showToast("Password reset link sent to your email!", "success");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch {
      showToast("Failed to send reset link. Try again.", "error");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-premium">
        <ToastContainer />

        <div className="split-layout">
          {/* LEFT PANEL – animated grid */}
          <div className="brand-panel">
            <div className="particle particle-1"></div>
            <div className="particle particle-2"></div>
            <div className="particle particle-3"></div>

            <div className="logo-area">
              {!logoError ? (
                <img src={logo} alt="Tesseract" className="premium-logo" onError={() => setLogoError(true)} />
              ) : (
                <div className="logo-fallback">🔷 TESSERACT</div>
              )}
            </div>

            <div className="value-text">
              <h2>Centralized Provider Ecosystem</h2>
              <p>Connect projects, manage providers, and control credentials – all in one intelligent platform.</p>
            </div>

            <div className="feature-grid">
              <div className="grid-card">
                <i className="fas fa-project-diagram"></i>
                <h3>Projects</h3>
                <p>Create & manage multiple projects, teams, and access levels</p>
              </div>
              <div className="grid-card">
                <i className="fas fa-handshake"></i>
                <h3>Providers</h3>
                <p>Onboard and connect trusted service providers instantly</p>
              </div>
              <div className="grid-card">
                <i className="fas fa-key"></i>
                <h3>Credentials</h3>
                <p>Centralised, secure storage for API keys & secrets</p>
              </div>
              <div className="grid-card">
                <i className="fas fa-charging-station"></i>
                <h3>Utilization</h3>
                <p>Real‑time usage analytics, billing, and performance</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL – perfectly centered form */}
          <div className="form-panel">
            <div className="form-container">
              <h2>Welcome back</h2>
              <p>Sign in to continue</p>
              <form onSubmit={handleSubmit}>
                <div className="input-group-premium">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={form.email}
                    disabled={loading}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="input-group-premium">
                  <label>Password</label>
                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      disabled={loading}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="eye-btn-premium"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <button className="login-btn-premium" type="submit" disabled={loading}>
                  <span className="btn-content">{loading ? <Loader /> : "Login"}</span>
                </button>

                <div className="forgot-premium">
                  <button type="button" onClick={() => setShowForgotModal(true)}>
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="forgot-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="close-btn" onClick={() => setShowForgotModal(false)}>×</button>
            </div>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <div className="input-group-premium">
              <label>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                disabled={forgotLoading}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowForgotModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleForgotPassword} disabled={forgotLoading}>
                <span className="btn-content">{forgotLoading ? <Loader /> : "Send Reset Link"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}