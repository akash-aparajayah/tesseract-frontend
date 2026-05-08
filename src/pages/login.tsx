import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "../styles/Login.module.css";
import logo from "../assets/unnamed.png";
import { loginUser, forgotPasswordApi } from "../services/authApi";
import { FormState, Errors } from "../types/login.type";
import { useToast } from "../hooks/useToast";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";

export default function Login() {
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });

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

        if (!accessToken) {
          showToast("Invalid login response", "error");
          return;
        }

        localStorage.setItem("accessToken", accessToken);

        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        showToast("Login successful 🎉", "success");

        navigate("/dashboard");
      } else {
        showToast(res?.data?.message || "Login failed", "error");
      }
    } catch (err: unknown) {
      let errorMessage = "An error occurred";

      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || errorMessage;
      }

      console.error(errorMessage);

      showToast(`❌ ${errorMessage} !`, "error");
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
      await forgotPasswordApi({
        email: forgotEmail,
      });

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
    <div className={styles["login-wrapper"]}>
      <ToastContainer />
      <div className={styles["login-premium"]}>
        <div className={styles["split-layout"]}>
          <div className={styles["brand-panel"]}>
            <div
              className={`${styles["particle"]} ${styles["particle-1"]}`}
            ></div>

            <div
              className={`${styles["particle"]} ${styles["particle-2"]}`}
            ></div>

            <div
              className={`${styles["particle"]} ${styles["particle-3"]}`}
            ></div>

            <div className={styles["logo-area"]}>
              {!logoError ? (
                <img
                  src={logo}
                  alt="Tesseract"
                  className={styles["premium-logo"]}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className={styles["logo-fallback"]}>🔷 TESSERACT</div>
              )}
            </div>

            <div className={styles["value-text"]}>
              <h2>Centralized Provider Ecosystem</h2>

              <p>
                Connect projects, manage providers, and control credentials –
                all in one intelligent platform.
              </p>
            </div>

            <div className={styles["feature-grid"]}>
              <div className={styles["grid-card"]}>
                <i className="fas fa-project-diagram"></i>

                <h3>Projects</h3>

                <p>
                  Create & manage multiple projects, teams, and access levels
                </p>
              </div>

              <div className={styles["grid-card"]}>
                <i className="fas fa-handshake"></i>

                <h3>Providers</h3>

                <p>Onboard and connect trusted service providers instantly</p>
              </div>

              <div className={styles["grid-card"]}>
                <i className="fas fa-key"></i>

                <h3>Credentials</h3>

                <p>Centralized, secure storage for API keys & secrets</p>
              </div>

              <div className={styles["grid-card"]}>
                <i className="fas fa-charging-station"></i>

                <h3>Utilization</h3>

                <p>Real-time usage analytics, billing, and performance</p>
              </div>
            </div>
          </div>

          <div className={styles["form-panel"]}>
            <div className={styles["form-container"]}>
              <h2>Welcome back</h2>

              <p>Sign in to continue</p>

              <form onSubmit={handleSubmit}>
                <div className={styles["input-group-premium"]}>
                  <label>Email address</label>

                  <input
                    type="email"
                    placeholder="admin@example.com"
                    value={form.email}
                    disabled={loading}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />

                  {errors.email && (
                    <span className={styles["error-text"]}>{errors.email}</span>
                  )}
                </div>

                <div className={styles["input-group-premium"]}>
                  <label>Password</label>

                  <div className={styles["password-wrapper"]}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password}
                      disabled={loading}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password: e.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      className={styles["eye-btn-premium"]}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {errors.password && (
                    <span className={styles["error-text"]}>
                      {errors.password}
                    </span>
                  )}
                </div>

                <button
                  className={styles["login-btn-premium"]}
                  type="submit"
                  disabled={loading}
                >
                  <span className={styles["btn-content"]}>
                    {loading ? "Logging in..." : "Login"}
                  </span>
                </button>

                <div className={styles["forgot-premium"]}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <div
          className={styles["modal-overlay"]}
          onClick={() => setShowForgotModal(false)}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
            className={styles["forgot-modal"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h3>Forgot Password</h3>

              <button
                className={styles["close-btn"]}
                onClick={() => setShowForgotModal(false)}
              >
                ×
              </button>
            </div>

            <p>
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <div className={styles["input-group-premium"]}>
              <label>Email</label>

              <input
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                disabled={forgotLoading}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>

            <div className={styles["modal-actions"]}>
              <button
                className={styles["btn-cancel"]}
                onClick={() => setShowForgotModal(false)}
              >
                Cancel
              </button>

              <button
                className={styles["btn-submit"]}
                onClick={handleForgotPassword}
                disabled={forgotLoading}
              >
                <span className={styles["btn-content"]}>
                  {forgotLoading ? (
                    <div className={styles["inline-loader"]}></div>
                  ) : (
                    "Send Reset Link"
                  )}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
