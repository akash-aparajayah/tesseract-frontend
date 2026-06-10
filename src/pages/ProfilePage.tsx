import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Eye,
    EyeOff,
    CircleCheck,
    CircleX,
    Pencil,
} from "lucide-react";
import styles from "../styles/ProfilePage.module.css";
import Toast from "../components/common/Toast";
import {
    updatePasswordApi, updatePasskeyApi, validateUserSecretApi, forgotPasswordSelfApi,
    forgotPasskeyApi, getProfileApi,
    updateProfileApi,
} from "@/services/authApi";

/**
 * Toast notification interface
 * Manages success and error messages displayed to user
 */
interface ToastState {
    id: number;
    message: string;
    type: "success" | "error";
}

export default function ProfilePage() {
    // Hooks for navigation and URL parameter extraction
    const [searchParams] = useSearchParams();

    /**
     * Active tab state   
     */
    const [activeTab, setActiveTab] = useState<"password" | "passkey">(
        (searchParams.get("tab") as "password" | "passkey") || "password"
    );

    const [isEditingProfile, setIsEditingProfile] =
        useState(false);

    const [profile, setProfile] =
        useState({
            user_name: "",
            email: "",
            role: "",
            phone_number: "",
            description: "",
            profile_image: "",
        });
    // ============================================================
    // PASSWORD FORM STATES
    // ============================================================

    /** New password input value */
    const [newPassword, setNewPassword] = useState("");

    /** Confirm password input value for validation */
    const [confirmPassword, setConfirmPassword] = useState("");

    /** Toggle visibility for new password field */
    const [showNewPassword, setShowNewPassword] = useState(false);

    /** Toggle visibility for confirm password field */
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    /** Loading state during password update API call */
    const [isUpdating, setIsUpdating] = useState(false);

    // Current password verification
    const [currentPassword, setCurrentPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);
    const [currentPasswordError, setCurrentPasswordError] = useState("");

    // ============================================================
    // PASSKEY FORM STATES
    // ============================================================

    /** Current passkey input for verification */
    const [currentPasskey, setCurrentPasskey] = useState("");

    /** New passkey input value */
    const [newPasskey, setNewPasskey] = useState("");

    /** Confirm passkey input for validation */
    const [confirmPasskey, setConfirmPasskey] = useState("");

    /** Toggle visibility for current passkey field */
    const [showCurrentPasskey, setShowCurrentPasskey] = useState(false);

    /** Toggle visibility for new passkey field */
    const [showNewPasskey, setShowNewPasskey] = useState(false);

    /** Toggle visibility for confirm passkey field */
    const [showConfirmPasskey, setShowConfirmPasskey] = useState(false);
    // Current passkey verification
    const [isPasskeyVerified, setIsPasskeyVerified] = useState(false);
    const [currentPasskeyError, setCurrentPasskeyError] = useState("");
    // ============================================================
    // PASSWORD VALIDATION RULES
    // ============================================================
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError,] = useState("");

    const [sendingPasswordReset, setSendingPasswordReset] =
        useState(false);
    const [sendingPasskeyReset, setSendingPasskeyReset] =
        useState(false);

    const profileFileRef =
        useRef<HTMLInputElement>(null);

    /**
     * Password validation rules for real-time feedback
     * Each rule is a boolean that updates as user types
     */
    const passwordRules = {
        minLength: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };

    // ==========  HANDLING FORGOT PASSWORD LINK ==========
    const handleForgotPassword = async () => {

        try {

            setSendingPasswordReset(true);

            await forgotPasswordSelfApi();

            showToast(
                "Password reset link sent successfully",
                "success"
            );

        } catch (err) {

            showToast(
                "Failed to send password reset email",
                "error"
            );

        } finally {

            setSendingPasswordReset(false);

        }
    };

    // =================  HANDLE FORGOT PASSKEY LINK =================
    const handleForgotPasskey = async () => {

        try {

            setSendingPasskeyReset(true);

            await forgotPasskeyApi();

            showToast(
                "Credential passkey reset link sent successfully",
                "success"
            );

        } catch {

            showToast(
                "Unable to send reset email",
                "error"
            );

        } finally {

            setSendingPasskeyReset(false);

        }
    };


    useEffect(() => {
        if (passwordTouched) {
            if (!newPassword) {
                setPasswordError("Password is required");
            } else if (!Object.values(passwordRules).every(Boolean)) {
                setPasswordError("Password does not meet security requirements");
            } else {
                setPasswordError("");
            }
        }
    }, [newPassword, passwordTouched]);

    /**
     * Real-time confirm password validation
     * Checks if confirmation matches the password
     */



    // ============================================================
    // TOAST NOTIFICATION MANAGEMENT
    // ============================================================

    /** Array of active toast notifications */
    const [toasts, setToasts] = useState<ToastState[]>([]);

    /**
     * Synchronizes active tab with URL query parameter
     * Ensures tab state stays in sync when URL changes externally
     */
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "password" || tab === "passkey") {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {

        const loadProfile = async () => {

            try {

                const response =
                    await getProfileApi();

                setProfile(
                    response.data.data
                );

            } catch (error) {

                console.error(
                    "Failed to load profile",
                    error
                );

            }

        };

        loadProfile();

    }, []);

    /**
     * Removes a toast notification by its ID
     * @param id - The unique identifier of the toast to remove
     */
    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    /**
     * Creates and displays a new toast notification
     * @param message - The text message to display
     * @param type - The type of notification (success or error)
     */
    const showToast = (message: string, type: "success" | "error" = "error") => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    /**
     * Auto-remove toasts after 5 seconds
     * Improves UX by not requiring manual dismissal
     */
    useEffect(() => {
        if (toasts.length === 0) return;
        const timers = toasts.map((toast) =>
            setTimeout(() => removeToast(toast.id), 5000)
        );
        return () => timers.forEach((timer) => clearTimeout(timer));
    }, [toasts]);

    // ============================================================
    // PASSWORD CHANGE HANDLER
    // ============================================================

    /**
     * Handles password change form submission
     * Validates password requirements and makes API call
     * 
     * Validation Rules:
     * - Passwords must match
     * - Minimum 8 characters
     * - Must contain: uppercase, lowercase, number, special character
     * 
     * @param e - Form submission event
     */

    // Verify current password on blur
    const handleCurrentPasswordBlur = async () => {

        if (!currentPassword.trim()) return;

        try {

            await validateUserSecretApi({
                value: currentPassword,
                type: "password",
            });

            setIsPasswordVerified(true);
            setCurrentPasswordError("");

        } catch (err: any) {

            setIsPasswordVerified(false);

            setCurrentPasswordError(
                err?.response?.data?.message ||
                "Current password is incorrect"
            );
        }
    };

    const handleCurrentPasskeyBlur = async () => {

        if (!currentPasskey.trim()) return;

        try {

            await validateUserSecretApi({
                value: currentPasskey,
                type: "passkey",
            });

            setCurrentPasskeyError("");
            setIsPasskeyVerified(true);

        } catch (err: any) {

            setCurrentPasskeyError(
                err?.response?.data?.message ||
                "Current passkey is incorrect"
            );

            setIsPasskeyVerified(false);

        }

    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordVerified) {
            showToast(
                "Please verify current password",
                "error"
            );
            return;
        }

        // Check if passwords match
        if (newPassword !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        // Check minimum length requirement
        if (newPassword.length < 8) {
            showToast("Password must be at least 8 characters", "error");
            return;
        }

        /**
         * Password complexity regex
         * Requires: uppercase, lowercase, number, special character
         * Minimum 8 characters total
         */
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            showToast(
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
                "error"
            );
            return;
        }

        // Set loading state before API call
        setIsUpdating(true);

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("Authentication token not found");

            // Make API call to update password
            const response = await updatePasswordApi({ password: newPassword });

            // Validate successful response
            if (response.status !== 200 && response.status !== 201) {
                throw new Error(response.data?.message || "Failed to update password");
            }

            // Show success notification and clear form
            showToast("Password updated successfully", "success");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setIsPasswordVerified(false);

            setCurrentPasswordError("");
        } catch (err) {
            // Handle and display error message
            console.error("Password update error:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to update password";
            showToast(errorMessage, "error");
        } finally {
            // Reset loading state regardless of outcome
            setIsUpdating(false);
        }
    };

    // ============================================================
    // PASSKEY CHANGE HANDLER
    // ============================================================

    /**
     * Handles passkey change form submission
     * Validates passkey format and makes API call
     * 
     * Validation Rules:
     * - All passkeys must be exactly 6 digits
     * - New passkey and confirmation must match
     * 
     * @param e - Form submission event
     */
    const handlePasskeyChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasskeyVerified) {

            showToast(
                "Please verify current passkey",
                "error"
            );

            return;
        }

        // Validate current passkey format (must be 6 digits)
        if (!/^\d{6}$/.test(currentPasskey)) {
            showToast("Current passkey must be 6 digits", "error");
            return;
        }

        // Validate new passkey format (must be 6 digits)
        if (!/^\d{6}$/.test(newPasskey)) {
            showToast("New passkey must be 6 digits", "error");
            return;
        }

        // Check if new passkey and confirmation match
        if (newPasskey !== confirmPasskey) {
            showToast("Passkeys do not match", "error");
            return;
        }

        try {
            // Make API call to update passkey with current and new values
            const response = await updatePasskeyApi({
                currentPasskey,
                newPasskey,
            });

            // Validate successful response
            if (response.status !== 200) {
                throw new Error(response.data?.message);
            }

            // Show success notification and clear form
            showToast("Credential passkey updated successfully", "success");
            setCurrentPasskey("");
            setNewPasskey("");
            setConfirmPasskey("");
            setCurrentPasskeyError("");
            setIsPasskeyVerified(false);
        } catch (err: any) {
            // Handle and display error message from API or fallback
            showToast(
                err?.response?.data?.message || "Failed to update passkey",
                "error"
            );
        }
    };

    const handleProfileSave =
        async () => {

            try {

                const response =
                    await updateProfileApi({
                        user_name: profile.user_name,
                        phone_number: profile.phone_number,
                        description: profile.description,
                        profile_image: profile.profile_image,
                    });

                setProfile(
                    response.data.data
                );

                // Notify entire app that profile changed
                window.dispatchEvent(
                    new Event("profileUpdated")
                );

                showToast(
                    "Profile updated successfully",
                    "success"
                );

                setIsEditingProfile(
                    false
                );

            } catch {

                showToast(
                    "Failed to update profile",
                    "error"
                );

            }

        };

    // ============================================================
    // COMPONENT RENDER
    // ============================================================

    return (
        <>
            {/* 
        Toast Notification Container
        Fixed position to overlay on top of all content
        High z-index ensures visibility over other elements
      */}
            <div
                className="toast-container"
                style={{
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    zIndex: 9999
                }}
            >
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Main Profile Page Container */}
            <div className={styles.profilePage}>
                <div className={styles.profileContainer}>
                    <div className={styles.profileLayout}>
                        {/* 
            Tab Navigation
            Allows switching between password and passkey forms
            Active tab is highlighted with different styling
          */}<div className={styles.profileCard}>

                            <div
                                className={styles.profileHeader}
                            >

                                <div
                                    className={styles.profileAvatar}
                                    onClick={() =>
                                        isEditingProfile &&
                                        profileFileRef.current?.click()
                                    }
                                >

                                    {profile.profile_image ? (

                                        <img
                                            src={profile.profile_image}
                                            alt="Profile"
                                            className={styles.profileAvatarImg}
                                        />

                                    ) : (

                                        profile.user_name
                                            ?.charAt(0)
                                            ?.toUpperCase()

                                    )}

                                    {isEditingProfile && (
                                        <input
                                            ref={profileFileRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: "none" }}
                                            onChange={(e) => {

                                                const file =
                                                    e.target.files?.[0];

                                                if (!file) return;

                                                const reader =
                                                    new FileReader();

                                                reader.onloadend =
                                                    () => {

                                                        setProfile({
                                                            ...profile,
                                                            profile_image:
                                                                reader.result as string,
                                                        });

                                                    };

                                                reader.readAsDataURL(
                                                    file
                                                );

                                            }}
                                        />
                                    )}

                                </div>

                                {!isEditingProfile ? (
                                    <button
                                        className={styles.editBtn}
                                        onClick={() =>
                                            setIsEditingProfile(true)
                                        }
                                        title="Edit Profile"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                ) : (
                                    <div>
                                        <button
                                            className={
                                                styles.saveBtn
                                            }
                                            onClick={
                                                handleProfileSave
                                            }
                                        >
                                            Save
                                        </button>

                                        <button
                                            className={
                                                styles.cancelBtn
                                            }
                                            onClick={() =>
                                                setIsEditingProfile(
                                                    false
                                                )
                                            }
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                            </div>

                            <div
                                className={
                                    styles.profileInfo
                                }
                            >

                                <label>Name</label>

                                <input
                                    value={
                                        profile.user_name
                                    }
                                    disabled={
                                        !isEditingProfile
                                    }
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            user_name:
                                                e.target.value,
                                        })
                                    }
                                />

                                <label>Email</label>

                                <input
                                    value={profile.email}
                                    disabled
                                />

                                <label>Role</label>

                                <input
                                    value={profile.role}
                                    disabled
                                />

                                <label>
                                    Phone Number
                                </label>

                                <input
                                    value={
                                        profile.phone_number ||
                                        ""
                                    }
                                    disabled={
                                        !isEditingProfile
                                    }
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            phone_number:
                                                e.target.value,
                                        })
                                    }
                                />

                                <label>
                                    Description
                                </label>

                                <textarea
                                    rows={4}
                                    value={
                                        profile.description ||
                                        ""
                                    }
                                    disabled={
                                        !isEditingProfile
                                    }
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            description:
                                                e.target.value,
                                        })
                                    }
                                />

                            </div>

                        </div>
                        <div className={styles.securitySection}>
                            <div className={styles.tabs}>
                                {/* Password Tab */}
                                <button
                                    type="button"
                                    className={
                                        activeTab === "password"
                                            ? `${styles.tab} ${styles.tabActive}`
                                            : styles.tab
                                    }
                                    onClick={() => setActiveTab("password")}
                                    aria-selected={activeTab === "password"}
                                    role="tab"
                                >
                                    Change Password
                                </button>

                                {/* Passkey Tab */}
                                <button
                                    type="button"
                                    className={
                                        activeTab === "passkey"
                                            ? `${styles.tab} ${styles.tabActive}`
                                            : styles.tab
                                    }
                                    onClick={() => setActiveTab("passkey")}
                                    aria-selected={activeTab === "passkey"}
                                    role="tab"
                                >
                                    Change Credential Passkey
                                </button>
                            </div>

                            {/* 
            Tab Content Area
            Dynamically renders form based on active tab
            Each form has its own validation and submission logic
          */}
                            <div className={styles.tabContent}>

                                {/* Password Change Form */}
                                {activeTab === "password" && (
                                    <>
                                        {/* Left Column - Form Fields (35% width) */}
                                        <div className={styles.formColumn}>
                                            <form onSubmit={handlePasswordChange}>
                                                <div className={styles.formGroup}>
                                                    <label
                                                        className={styles.label}
                                                        htmlFor="currentPassword"
                                                    >
                                                        Current Password
                                                    </label>

                                                    <div className={styles.passwordWrapper}>
                                                        <input
                                                            id="currentPassword"
                                                            type={
                                                                showCurrentPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            placeholder="Enter current password"
                                                            value={currentPassword}
                                                            onChange={(e) => {
                                                                setCurrentPassword(
                                                                    e.target.value
                                                                );
                                                                setCurrentPasskeyError("");
                                                                setIsPasskeyVerified(false);
                                                            }}
                                                            onBlur={handleCurrentPasswordBlur}
                                                            required
                                                            className={`${styles.input} ${currentPasswordError
                                                                ? styles.inputError
                                                                : ""
                                                                }`}
                                                        />

                                                        <button
                                                            type="button"
                                                            className={styles.eyeButton}
                                                            onClick={() =>
                                                                setShowCurrentPassword(
                                                                    !showCurrentPassword
                                                                )
                                                            }
                                                        >
                                                            {showCurrentPassword
                                                                ? <EyeOff size={18} />
                                                                : <Eye size={18} />}
                                                        </button>
                                                    </div>

                                                    {currentPasswordError && (
                                                        <div className={styles.fieldError}>
                                                            {currentPasswordError}
                                                        </div>
                                                    )}
                                                    <div
                                                        className={styles.forgotLink}
                                                        onClick={
                                                            sendingPasswordReset
                                                                ? undefined
                                                                : handleForgotPassword
                                                        }
                                                        style={{
                                                            cursor: sendingPasswordReset
                                                                ? "not-allowed"
                                                                : "pointer",
                                                            opacity: sendingPasswordReset
                                                                ? 0.7
                                                                : 1,
                                                        }}
                                                    >
                                                        {sendingPasswordReset
                                                            ? "Sending reset link..."
                                                            : "Forgot Password?"}
                                                    </div>
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label className={styles.label} htmlFor="newPassword">
                                                        New Password
                                                    </label>
                                                    <div className={styles.passwordWrapper}>
                                                        <input
                                                            id="newPassword"
                                                            type={showNewPassword ? "text" : "password"}
                                                            placeholder="Enter new password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            onBlur={() => setPasswordTouched(true)}
                                                            required
                                                            className={`${styles.input} ${passwordError && passwordTouched ? styles.inputError : ""}`}
                                                            autoComplete="new-password"
                                                        />
                                                        <button
                                                            type="button"
                                                            className={styles.eyeButton}
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                                                        >
                                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                    {passwordError && passwordTouched && (
                                                        <div className={styles.fieldError}>{passwordError}</div>
                                                    )}
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label className={styles.label} htmlFor="confirmPassword">
                                                        Confirm Password
                                                    </label>
                                                    <div className={styles.passwordWrapper}>
                                                        <input
                                                            id="confirmPassword"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="Confirm new password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            onBlur={() => setConfirmPasswordTouched(true)}
                                                            required
                                                            className={`${styles.input} ${confirmPasswordError && confirmPasswordTouched ? styles.inputError : ""}`}
                                                            autoComplete="new-password"
                                                        />
                                                        <button
                                                            type="button"
                                                            className={styles.eyeButton}
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                        >
                                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                    {confirmPasswordError && confirmPasswordTouched && (
                                                        <div className={styles.fieldError}>{confirmPasswordError}</div>
                                                    )}
                                                </div>

                                                <button
                                                    type="submit"
                                                    className={styles.submitButton}
                                                    disabled={
                                                        isUpdating ||
                                                        !isPasswordVerified
                                                    }
                                                >
                                                    {isUpdating ? "Updating..." : "Update Password"}
                                                </button>
                                            </form>
                                        </div>

                                        {/* Right Column - Password Validation Rules */}
                                        <div className={styles.validationColumn}>
                                            <h4 className={styles.validationTitle}>Password Requirements</h4>
                                            <div className={styles.validationGrid}>
                                                <div className={`${styles.rule} ${passwordRules.minLength ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {passwordRules.minLength ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                                    <span>At least 8 characters</span>
                                                </div>
                                                <div className={`${styles.rule} ${passwordRules.uppercase ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {passwordRules.uppercase ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                                    <span>One uppercase letter</span>
                                                </div>
                                                <div className={`${styles.rule} ${passwordRules.lowercase ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {passwordRules.lowercase ? <CircleCheck size={14} /> : < CircleX size={14} />}
                                                    <span>One lowercase letter</span>
                                                </div>
                                                <div className={`${styles.rule} ${passwordRules.number ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {passwordRules.number ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                                    <span>One number</span>
                                                </div>
                                                <div className={`${styles.rule} ${passwordRules.special ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {passwordRules.special ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                                    <span>One special character</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Passkey Change Form */}
                                {activeTab === "passkey" && (
                                    <>
                                        {/* Left Column - Form Fields */}
                                        <div className={styles.formColumn}>
                                            <form onSubmit={handlePasskeyChange}>
                                                <div className={styles.formGroup}>
                                                    <label className={styles.label} htmlFor="currentPasskey">
                                                        Current Passkey
                                                    </label>
                                                    <div className={styles.passwordWrapper}>
                                                        <input
                                                            id="currentPasskey"
                                                            type={showCurrentPasskey ? "text" : "password"}
                                                            placeholder="Enter current 6-digit passkey"
                                                            value={currentPasskey}
                                                            onChange={(e) => {
                                                                setCurrentPasskey(
                                                                    e.target.value
                                                                );
                                                                setCurrentPasskeyError("");
                                                                setIsPasskeyVerified(false);
                                                            }}
                                                            maxLength={6}
                                                            required
                                                            className={styles.input}
                                                            pattern="\d{6}"
                                                            title="Must be exactly 6 digits"
                                                            onBlur={handleCurrentPasskeyBlur}
                                                        />
                                                        <button
                                                            type="button"
                                                            className={styles.eyeButton}
                                                            onClick={() => setShowCurrentPasskey(!showCurrentPasskey)}
                                                            aria-label={showCurrentPasskey ? "Hide passkey" : "Show passkey"}
                                                        >
                                                            {showCurrentPasskey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                    {currentPasskeyError && (
                                                        <div className={styles.fieldError}>
                                                            {currentPasskeyError}
                                                        </div>
                                                    )}

                                                    <div
                                                        className={styles.forgotLink}
                                                        onClick={
                                                            sendingPasskeyReset
                                                                ? undefined
                                                                : handleForgotPasskey
                                                        }
                                                        style={{
                                                            cursor: sendingPasskeyReset
                                                                ? "not-allowed"
                                                                : "pointer",
                                                            opacity: sendingPasskeyReset
                                                                ? 0.7
                                                                : 1,
                                                        }}
                                                    >
                                                        {sendingPasskeyReset
                                                            ? "Sending reset link..."
                                                            : "Forgot Credential Passkey?"}
                                                    </div>
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label className={styles.label} htmlFor="newPasskey">
                                                        New Passkey
                                                    </label>
                                                    <div className={styles.passwordWrapper}>
                                                        <input
                                                            id="newPasskey"
                                                            type={showNewPasskey ? "text" : "password"}
                                                            placeholder="Enter new 6-digit passkey"
                                                            value={newPasskey}
                                                            onChange={(e) => setNewPasskey(e.target.value)}
                                                            maxLength={6}
                                                            required
                                                            className={styles.input}
                                                            pattern="\d{6}"
                                                            title="Must be exactly 6 digits"
                                                        />
                                                        <button
                                                            type="button"
                                                            className={styles.eyeButton}
                                                            onClick={() => setShowNewPasskey(!showNewPasskey)}
                                                            aria-label={showNewPasskey ? "Hide passkey" : "Show passkey"}
                                                        >
                                                            {showNewPasskey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label className={styles.label} htmlFor="confirmPasskey">
                                                        Confirm Passkey
                                                    </label>
                                                    <div className={styles.passwordWrapper}>
                                                        <input
                                                            id="confirmPasskey"
                                                            type={showConfirmPasskey ? "text" : "password"}
                                                            placeholder="Confirm new 6-digit passkey"
                                                            value={confirmPasskey}
                                                            onChange={(e) => setConfirmPasskey(e.target.value)}
                                                            maxLength={6}
                                                            required
                                                            className={styles.input}
                                                            pattern="\d{6}"
                                                            title="Must be exactly 6 digits"
                                                        />
                                                        <button
                                                            type="button"
                                                            className={styles.eyeButton}
                                                            onClick={() => setShowConfirmPasskey(!showConfirmPasskey)}
                                                            aria-label={showConfirmPasskey ? "Hide passkey" : "Show passkey"}
                                                        >
                                                            {showConfirmPasskey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    className={styles.submitButton}
                                                    disabled={!isPasskeyVerified}
                                                >
                                                    Update Passkey
                                                </button>
                                            </form>
                                        </div>

                                        {/* Right Column - Empty for passkey tab (maintains layout) */}
                                        <div className={styles.validationColumn}>
                                            <h4 className={styles.validationTitle}>Passkey Requirements</h4>
                                            <div className={styles.validationGrid}>
                                                <div className={`${styles.rule} ${/^\d{6}$/.test(newPasskey) ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {/^\d{6}$/.test(newPasskey) ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                                    <span>Must be exactly 6 digits</span>
                                                </div>
                                                <div className={`${styles.rule} ${newPasskey && confirmPasskey && newPasskey === confirmPasskey ? styles.ruleValid : styles.ruleInvalid}`}>
                                                    {newPasskey && confirmPasskey && newPasskey === confirmPasskey ? <CircleCheck size={14} /> : <CircleX size={14} />}
                                                    <span>Passkeys must match</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}