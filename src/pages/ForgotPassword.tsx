import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/forgot.css";
import { resetPasswordApi } from "../services/authApi";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password || !confirmPassword) {
      setMessageType("error");
      setMessage("⚠️ All fields are required");
      return;
    }

    const isPasswordValid =
      Object.values(passwordRules).every(Boolean);

    if (!isPasswordValid) {
      setMessageType("error");
      setMessage(
        "⚠️ Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("❌ Passwords do not match");
      return;
    }

    if (!token) {
      setMessageType("error");
      setMessage("❌ Invalid reset link");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await resetPasswordApi({ token, password });
      setMessageType("success");
      setMessage("✅ Password reset successful! Redirecting...");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setMessageType("error");
      setMessage(err?.response?.data?.message || "❌ Invalid or expired link");
    } finally {
      setLoading(false);
    }
  };

  const passwordRules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  return (
    <div className="reset-page">
      {/* Toast / floating message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 10 }}
            exit={{ opacity: 0, y: -60 }}
            className={`reset-toast ${messageType}`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="reset-card">
        <div className="reset-card-inner">
          <div className="reset-header">
            <h2>Create new password</h2>
            <p>Your new password must be different from previously used passwords</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="password-rules">
              <div
                className={`rule ${passwordRules.minLength ? "valid" : "invalid"
                  }`}
              >
                {passwordRules.minLength ? "✅" : "❌"}
                <span>At least 8 characters</span>
              </div>

              <div
                className={`rule ${passwordRules.uppercase ? "valid" : "invalid"
                  }`}
              >
                {passwordRules.uppercase ? "✅" : "❌"}
                <span>One uppercase letter</span>
              </div>

              <div
                className={`rule ${passwordRules.lowercase ? "valid" : "invalid"
                  }`}
              >
                {passwordRules.lowercase ? "✅" : "❌"}
                <span>One lowercase letter</span>
              </div>

              <div
                className={`rule ${passwordRules.number ? "valid" : "invalid"
                  }`}
              >
                {passwordRules.number ? "✅" : "❌"}
                <span>One number</span>
              </div>

              <div
                className={`rule ${passwordRules.special ? "valid" : "invalid"
                  }`}
              >
                {passwordRules.special ? "✅" : "❌"}
                <span>One special character</span>
              </div>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button className="reset-btn" type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>

            <div className="login-link">
              <button type="button" onClick={() => navigate("/")}>
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}