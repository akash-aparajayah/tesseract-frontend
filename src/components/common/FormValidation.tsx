import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Check, X } from "lucide-react";
import styles from "../../styles/FormValidation.module.css";

// Validation rules - add more as needed
const validateField = (fieldName: string, value: string): string => {
    if (!value || !value.trim()) return "This field is required";

    const val = value.trim();
    const key = fieldName.toLowerCase();

    // ===== TWILIO - SIMPLE VALIDATIONS =====

    // Account SID - just needs to start with AC
    if (key.includes("account") && key.includes("sid")) {
        if (!val.startsWith("AC") || val.length < 10) {
            return "Must start with 'AC' (e.g., ACabc123...)";
        }
    }

    // Auth Token - no strict validation, just min length
    if (key.includes("auth") && key.includes("token")) {
        if (val.length < 10) {
            return "Must be at least 10 characters";
        }
    }

    // Phone Number - just numbers, + allowed at start
    if (key.includes("phone") || key.includes("mobile") || key.includes("number")) {
        if (!/^\+?\d{7,15}$/.test(val)) {
            return "Enter a valid phone number (e.g., +1234567890 or 9876543210)";
        }
    }

    // ===== SENDGRID VALIDATIONS =====

    // SendGrid API Key - starts with "SG."
    if ((key.includes("sendgrid") || key.includes("sg")) && key.includes("api") && key.includes("key")) {
        if (!val.startsWith("SG.") || val.length < 20) {
            return "Must start with 'SG.' (e.g., SG.abc123...)";
        }
    }

    // SendGrid API Key (generic check if field is just "api_key")
    if (key === "api_key" || key === "apikey") {
        if (val.length < 10) {
            return "Must be at least 10 characters";
        }
    }

    // From Email
    if ((key.includes("from") || key.includes("sender")) && key.includes("email")) {
        if (!val.includes("@")) {
            return "Must be a valid email address";
        }
    }

    // ===== GENERIC VALIDATIONS =====

    // API Key
    if (key.includes("api") && key.includes("key")) {
        if (val.length < 6) return "Must be at least 6 characters";
    }

    // Token
    if (key.includes("token") && val.length < 6) {
        return "Must be at least 6 characters";
    }

    // Secret/Password
    if ((key.includes("secret") || key.includes("password") || key.includes("pass")) && val.length < 6) {
        return "Must be at least 6 characters";
    }

    // URL/Endpoint
    if ((key.includes("url") || key.includes("endpoint")) && !val.startsWith("http")) {
        return "Must start with http:// or https://";
    }

    // Email
    if (key.includes("email") && !val.includes("@")) {
        return "Invalid email address";
    }

    // Sender ID
    if ((key.includes("sender") || key.includes("from")) && key.includes("id")) {
        if (val.length < 3 || val.length > 11) {
            return "Must be 3-11 characters";
        }
    }

    // Default min length
    if (val.length < 2) return "Must be at least 2 characters";

    return "";
};

// Check if field should show password toggle
const isPasswordField = (fieldName: string): boolean => {
    const key = fieldName.toLowerCase();
    return key.includes("key") || key.includes("token") || key.includes("secret") ||
        key.includes("password") || key.includes("pass") || key.includes("auth");
};

interface Props {
    fields: Record<string, string>;
    onChange: (name: string, value: string) => void;
    excludeFields?: string[];
    title?: string;
    schema?: Array<{       // ADD THIS
        key: string;
        label: string;
        placeholder?: string;
        description?: string;
        is_secret?: boolean;
    }>;
}

const FormValidation: React.FC<Props> = ({
    fields,
    onChange,
    excludeFields = ["mode", "endpoint", "id"],
    title = "Credentials",
    schema
}) => {
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const handleValidateAll = () => {
            const allTouched: Record<string, boolean> = {};
            Object.keys(fields).forEach(key => {
                if (!excludeFields.includes(key)) {
                    allTouched[key] = true;
                }
            });
            setTouched(allTouched);
        };

        window.addEventListener('validateAllFields', handleValidateAll);
        return () => window.removeEventListener('validateAllFields', handleValidateAll);
    }, [fields, excludeFields]);

    const getLabel = (key: string): string => {
        // Use schema label if available
        if (schema) {
            const field = schema.find(f => f.key === key);
            if (field?.label) return field.label;
        }
        return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
    };

    const getError = (key: string): string => {
        return touched[key] ? validateField(key, fields[key] || "") : "";
    };

    const isValid = (key: string): boolean => {
        return touched[key] && !validateField(key, fields[key] || "") && !!fields[key];
    };

    const activeFields = Object.keys(fields).filter(key => !excludeFields.includes(key));

    if (activeFields.length === 0) return null;

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>{title}</h4>

            {activeFields.map(key => {
                const error = getError(key);
                const valid = isValid(key);
                const isPwd = isPasswordField(key);

                return (
                    <div key={key} className={styles.fieldGroup}>
                        <label className={styles.label}>
                            {getLabel(key)} <span className={styles.required}>*</span>
                        </label>

                        <div className={`${styles.inputWrapper} ${error ? styles.error : ""} ${valid ? styles.valid : ""}`}>
                            <input
                                type={isPwd && !showPasswords[key] ? "password" : "text"}
                                value={fields[key] || ""}
                                onChange={(e) => onChange(key, e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, [key]: true }))}
                                placeholder={
                                    schema
                                        ? (schema.find(f => f.key === key)?.placeholder || `Enter ${getLabel(key)}`)
                                        : `Enter ${getLabel(key)}`
                                }
                                className={styles.input}
                            />

                            {isPwd && fields[key] && (
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                                    className={styles.eyeBtn}
                                    style={{ right: (error || valid) ? "36px" : "10px" }}
                                >
                                    {showPasswords[key] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                                </button>
                            )}

                            {touched[key] && (
                                <span className={styles.iconRight}>
                                    {error ? <X size={16} color="#ef4444" /> : valid ? <Check size={16} color="#10b981" /> : null}
                                </span>
                            )}
                        </div>

                        {/* Error message below input */}
                        {touched[key] && error && (
                            <div className={styles.errorMsg}>
                                <X size={12} /> {error}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Helper: Check if form has errors (use before submit)
export const hasErrors = (
    fields: Record<string, string>,
    excludeFields: string[] = ["mode", "endpoint", "id"]
): boolean => {
    return Object.keys(fields)
        .filter(key => !excludeFields.includes(key))
        .some(key => validateField(key, fields[key] || ""));
};

export default FormValidation;