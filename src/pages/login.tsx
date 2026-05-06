import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/login.css";
import logo from "../assets/env.svg";
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
    <div className="login-page">
      {/* 🌟 New animated background elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="bg-overlay"></div>  {/* Improves card readability */}

      <ToastContainer />

      <div className="login-card">
        <div className="login-card-inner">
          <div className="logo-area">
            {!logoError ? (
              <img
                src={logo}
                alt="Tesseract"
                className="login-logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="logo-fallback">🔷 TESSERACT</div>
            )}
          </div>

          <h2>Welcome back</h2>
          <p className="welcome-text">Sign in to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
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

            <div className="input-group">
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
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              <span className="btn-content">
                {loading ? <Loader /> : "Login"}
              </span>
            </button>

            <div className="extra-links">
              <button
                type="button"
                className="forgot-link"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowForgotModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="forgot-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button
                className="close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                ×
              </button>
            </div>

            <p>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <div className="input-group">
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
              <button
                className="btn-cancel"
                onClick={() => setShowForgotModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn-submit"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                <span className="btn-content">
                  {forgotLoading ? <Loader /> : "Send Reset Link"}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}