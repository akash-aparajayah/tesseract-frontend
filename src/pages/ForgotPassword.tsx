import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/forgot.css";
import {
  resetPasswordApi,
  validatePasswordResetTokenApi,
} from "../services/authApi";
import { ShieldAlert } from "lucide-react";
import { useToast } from "../hooks/useToast";
import {
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { showToast, ToastContainer } =
    useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [tokenLoading, setTokenLoading] =
    useState(true);

  const [tokenValid, setTokenValid] =
    useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password || !confirmPassword) {
      showToast(
        "All fields are required",
        "error"
      );
      return;
    }

    const isPasswordValid =
      Object.values(passwordRules).every(Boolean);

    if (!isPasswordValid) {
      showToast(
        "Password does not meet security requirements",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showToast(
        "Passwords do not match",
        "error"
      );
      return;
    }

    if (!token) {
      showToast(
        "Invalid reset link",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      await resetPasswordApi({ token, password });
      showToast(
        "Password reset successful",
        "success"
      );

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast(
        err?.response?.data?.message ||
        "Invalid or expired link",
        "error"
      );
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

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {

    try {

      const res =
        await validatePasswordResetTokenApi(
          token!
        );

      setTokenValid(
        res.data.data.status ===
        "valid"
      );

    } catch {

      setTokenValid(false);

    } finally {

      setTokenLoading(false);

    }
  };

  if (tokenLoading) {
    return (
      <>
        <ToastContainer />
        <div className="reset-page">
          Loading...
        </div>
      </>
    );
  }

  if (!tokenValid) {
    return (
      <>
        <ToastContainer />
        <div className="reset-page">
          <div className="reset-card">

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <ShieldAlert
                size={48}
                strokeWidth={2}
              />

              <h2
                style={{
                  marginTop: "12px",
                }}
              >
                Link Expired
              </h2>
            </div>

            <p>
              This password reset link
              has expired or has already
              been used.
            </p>

            <button
              className="reset-btn"
              onClick={() =>
                navigate("/")
              }
            >
              Back to Login
            </button>

          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastContainer />

      <div className="reset-page">
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
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <div className="password-rules">
                <div
                  className={`rule ${passwordRules.minLength ? "valid" : "invalid"
                    }`}
                >
                  {passwordRules.minLength ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span>At least 8 characters</span>
                </div>

                <div
                  className={`rule ${passwordRules.uppercase ? "valid" : "invalid"
                    }`}
                >
                  {passwordRules.uppercase ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span>One uppercase letter</span>
                </div>

                <div
                  className={`rule ${passwordRules.lowercase ? "valid" : "invalid"
                    }`}
                >
                  {passwordRules.lowercase ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span>One lowercase letter</span>
                </div>

                <div
                  className={`rule ${passwordRules.number ? "valid" : "invalid"
                    }`}
                >
                  {passwordRules.number ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span>One number</span>
                </div>

                <div
                  className={`rule ${passwordRules.special ? "valid" : "invalid"
                    }`}
                >
                  {passwordRules.special ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
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
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
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
    </>

  );
}