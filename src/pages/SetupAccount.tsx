import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import {
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Loader2,
} from "lucide-react";

import styles from "../styles/SetupAccount.module.css";

import {
    validateSetupTokenApi,
    completeSetupApi,
} from "../services/authApi";

export default function SetupAccount() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [credentialPasskey, setCredentialPasskey] = useState("");
    const [confirmCredentialPasskey, setConfirmCredentialPasskey] = useState("");

    // Field-specific errors
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [passkeyError, setPasskeyError] = useState("");
    const [confirmPasskeyError, setConfirmPasskeyError] = useState("");

    // Track if fields have been touched
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
    const [passkeyTouched, setPasskeyTouched] = useState(false);
    const [confirmPasskeyTouched, setConfirmPasskeyTouched] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPasskey, setShowPasskey] = useState(false);
    const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const passwordRules = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const isPasswordValid = Object.values(passwordRules).every(Boolean);
    const isPasskeyValid = /^\d{6}$/.test(credentialPasskey);

    useEffect(() => {
        validateToken();
    }, []);

    // Real-time password validation
    useEffect(() => {
        if (passwordTouched) {
            if (!password) {
                setPasswordError("Password is required");
            } else if (!isPasswordValid) {
                setPasswordError("Password does not meet security requirements");
            } else {
                setPasswordError("");
            }
        }
    }, [password, isPasswordValid, passwordTouched]);

    // Real-time confirm password validation
    useEffect(() => {
        if (confirmPasswordTouched) {
            if (!confirmPassword) {
                setConfirmPasswordError("Please confirm your password");
            } else if (password !== confirmPassword) {
                setConfirmPasswordError("Passwords do not match");
            } else {
                setConfirmPasswordError("");
            }
        }
    }, [confirmPassword, password, confirmPasswordTouched]);

    // Real-time passkey validation (only format, not match)
    useEffect(() => {
        if (passkeyTouched) {
            if (!credentialPasskey) {
                setPasskeyError("Credential passkey is required");
            } else if (!isPasskeyValid) {
                setPasskeyError("Must contain exactly 6 digits");
            } else {
                setPasskeyError("");
            }
        }
    }, [credentialPasskey, isPasskeyValid, passkeyTouched]);

    // Real-time confirm passkey validation (only match, shown on submit)
    // We'll handle match validation on submit only

    const validateToken = async () => {
        try {
            const res = await validateSetupTokenApi(token!);
            setStatus(res.data.data.status);
        } catch {
            setStatus("expired");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Mark all fields as touched
        setPasswordTouched(true);
        setConfirmPasswordTouched(true);
        setPasskeyTouched(true);
        setConfirmPasskeyTouched(true);

        setSubmitError("");

        // Validate password
        if (!password) {
            setPasswordError("Password is required");
            return;
        }

        if (!isPasswordValid) {
            setPasswordError("Password does not meet security requirements");
            return;
        }

        // Validate confirm password
        if (!confirmPassword) {
            setConfirmPasswordError("Please confirm your password");
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
            return;
        }

        // Validate passkey format
        if (!credentialPasskey) {
            setPasskeyError("Credential passkey is required");
            return;
        }

        if (!isPasskeyValid) {
            setPasskeyError("Must contain exactly 6 digits");
            return;
        }

        // Validate passkey match (only checked on submit)
        if (!confirmCredentialPasskey) {
            setConfirmPasskeyError("Please confirm your credential passkey");
            return;
        }

        if (credentialPasskey !== confirmCredentialPasskey) {
            setConfirmPasskeyError("Passkeys do not match");
            return;
        }

        // Clear all errors and submit
        setIsSubmitting(true);

        try {
            await completeSetupApi({
                token: token!,
                password,
                credentialPasskey,
            });

            setStatus("success");

            setTimeout(() => {
                navigate("/");
            }, 2500);
        } catch (err: any) {
            setSubmitError(err?.response?.data?.message || "Setup failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loaderCard}>
                    <div className={styles.spinner}></div>
                    <p>Verifying your setup link...</p>
                </div>
            </div>
        );
    }

    if (status === "configured") {
        return (
            <div className={styles.wrapper}>
                <div className={styles.statusCard}>
                    <div className={styles.statusIcon}>⚠️</div>
                    <h2>Account Already Configured</h2>
                    <p>This account has already been set up. Please log in instead.</p>
                    <button onClick={() => navigate("/")} className={styles.primaryButton}>
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (status === "expired") {
        return (
            <div className={styles.wrapper}>
                <div className={styles.statusCard}>
                    <div className={styles.statusIcon}>🔒</div>
                    <h2>Setup Link Expired</h2>
                    <p>This invitation link has expired. Please contact your administrator for a new one.</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className={styles.wrapper}>
                <div className={styles.statusCard}>
                    <div className={styles.successIcon}>✓</div>
                    <h2>Account Created Successfully!</h2>
                    <p>Redirecting you to login...</p>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.backgroundDecoration}>
                <div className={styles.blob1}></div>
                <div className={styles.blob2}></div>
            </div>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <div className={styles.logo}>🔐</div>
                    <h2>Set up your account</h2>
                    <p>Create your credentials to get started</p>
                </div>

                {submitError && (
                    <div className={styles.errorAlert}>
                        <span>⚠️</span>
                        <p>{submitError}</p>
                    </div>
                )}

                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <h4>Login Password</h4>
                        <p className={styles.sectionNote}>
                            Used to sign in to the Credential Management Platform
                        </p>
                    </div>

                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => setPasswordTouched(true)}
                                    className={`${styles.input} ${passwordError && passwordTouched ? styles.inputError : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeButton}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {passwordError && passwordTouched && (
                                <div className={styles.fieldError}>{passwordError}</div>
                            )}
                        </div>

                        <div className={styles.inputWrapper}>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onBlur={() => setConfirmPasswordTouched(true)}
                                    className={`${styles.input} ${confirmPasswordError && confirmPasswordTouched ? styles.inputError : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={styles.eyeButton}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {confirmPasswordError && confirmPasswordTouched && (
                                <div className={styles.fieldError}>{confirmPasswordError}</div>
                            )}
                        </div>
                    </div>

                    <div className={styles.validationGrid}>
                        <div className={`${styles.rule} ${passwordRules.minLength ? styles.valid : styles.invalid}`}>
                            {passwordRules.minLength ? <CheckCircle size={14} className={styles.checkIcon} /> : <XCircle size={14} className={styles.xIcon} />}
                            <span>At least 8 characters</span>
                        </div>
                        <div className={`${styles.rule} ${passwordRules.uppercase ? styles.valid : styles.invalid}`}>
                            {passwordRules.uppercase ? <CheckCircle size={14} className={styles.checkIcon} /> : <XCircle size={14} className={styles.xIcon} />}
                            <span>One uppercase letter</span>
                        </div>
                        <div className={`${styles.rule} ${passwordRules.lowercase ? styles.valid : styles.invalid}`}>
                            {passwordRules.lowercase ? <CheckCircle size={14} className={styles.checkIcon} /> : <XCircle size={14} className={styles.xIcon} />}
                            <span>One lowercase letter</span>
                        </div>
                        <div className={`${styles.rule} ${passwordRules.number ? styles.valid : styles.invalid}`}>
                            {passwordRules.number ? <CheckCircle size={14} className={styles.checkIcon} /> : <XCircle size={14} className={styles.xIcon} />}
                            <span>One number</span>
                        </div>
                        <div className={`${styles.rule} ${passwordRules.special ? styles.valid : styles.invalid}`}>
                            {passwordRules.special ? <CheckCircle size={14} className={styles.checkIcon} /> : <XCircle size={14} className={styles.xIcon} />}
                            <span>One special character</span>
                        </div>
                    </div>
                </div>

                <div className={styles.formSection}>
                    <div className={styles.sectionHeader}>
                        <h4>Credential Passkey</h4>
                        <p className={styles.sectionNote}>
                            Used only to unlock provider credentials. It is NOT used for login.
                        </p>
                    </div>

                    <div className={styles.inputGroup}>
                        <div className={styles.inputWrapper}>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPasskey ? "text" : "password"}
                                    placeholder="6-digit passkey"
                                    maxLength={6}
                                    inputMode="numeric"
                                    value={credentialPasskey}
                                    onKeyDown={(e) => {
                                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                                        if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onChange={(e) => setCredentialPasskey(e.target.value)}
                                    onBlur={() => setPasskeyTouched(true)}
                                    className={`${styles.input} ${passkeyError && passkeyTouched ? styles.inputError : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasskey(!showPasskey)}
                                    className={styles.eyeButton}
                                >
                                    {showPasskey ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {passkeyError && passkeyTouched && (
                                <div className={styles.fieldError}>{passkeyError}</div>
                            )}
                        </div>

                        <div className={styles.inputWrapper}>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showConfirmPasskey ? "text" : "password"}
                                    placeholder="Confirm passkey"
                                    maxLength={6}
                                    inputMode="numeric"
                                    value={confirmCredentialPasskey}
                                    onKeyDown={(e) => {
                                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
                                        if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onChange={(e) => setConfirmCredentialPasskey(e.target.value)}
                                    onBlur={() => setConfirmPasskeyTouched(true)}
                                    className={`${styles.input} ${confirmPasskeyError && confirmPasskeyTouched ? styles.inputError : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPasskey(!showConfirmPasskey)}
                                    className={styles.eyeButton}
                                >
                                    {showConfirmPasskey ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {confirmPasskeyError && confirmPasskeyTouched && (
                                <div className={styles.fieldError}>{confirmPasskeyError}</div>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={styles.submitButton}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} className={styles.spinningIcon} />
                            Creating Account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                </button>

                <p className={styles.footerNote}>
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}