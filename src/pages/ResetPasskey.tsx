import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    resetPasskeyApi,
    validatePasskeyResetTokenApi,
} from "../services/authApi";
import styles from "../styles/ResetPasskey.module.css";
import {
    ShieldAlert, CheckCircle2,
    XCircle,
} from "lucide-react";
import { useToast } from "../hooks/useToast";

export default function ResetPasskey() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [tokenLoading, setTokenLoading] =
        useState(true);

    const [tokenValid, setTokenValid] =
        useState(false);

    const [passkey, setPasskey] = useState("");
    const [confirmPasskey, setConfirmPasskey] = useState("");
    const [loading, setLoading] = useState(false);
    const { showToast, ToastContainer } =
        useToast();

    const isPasskeyValid = /^\d{6}$/.test(passkey);

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault();

        if (!passkey || !confirmPasskey) {
            showToast(
                "All fields are required",
                "error"
            );
            return;
        }

        if (!isPasskeyValid) {
            showToast(
                "All fields are required",
                "error"
            );
            return;
        }

        if (passkey !== confirmPasskey) {
            showToast(
                "Passkeys do not match",
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

            await resetPasskeyApi({
                token,
                passkey,
            });

            showToast(
                "Credential passkey updated successfully",
                "success"
            );

            setTimeout(() => {
                navigate("/");
            }, 2000);

        } catch (err: any) {

            showToast(
                err?.response?.data?.message ||
                "Invalid or expired link",
                "error"
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        validateToken();
    }, []);

    const validateToken = async () => {

        try {

            const res =
                await validatePasskeyResetTokenApi(
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
            <div className={styles.page}>
                Loading...
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className={styles.page}>
                <div className={styles.card}>

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

                    <p className={styles.subtitle}>
                        This credential passkey
                        reset link has expired
                        or has already been used.
                    </p>

                    <button
                        className={styles.button}
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Back to Login
                    </button>

                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <div className={styles.page}>

                <div className={styles.card}>

                    <h2>
                        Reset Credential Passkey
                    </h2>

                    <p className={styles.subtitle}>
                        Create a new 6-digit credential passkey.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                    >

                        <div className={styles.group}>
                            <label>
                                New Passkey
                            </label>

                            <input
                                type="password"
                                maxLength={6}
                                inputMode="numeric"
                                value={passkey}
                                onChange={(e) =>
                                    setPasskey(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className={styles.rules}>

                            <div
                                className={
                                    isPasskeyValid
                                        ? styles.valid
                                        : styles.invalid
                                }
                            >
                                {isPasskeyValid ? (
                                    <CheckCircle2 size={18} />
                                ) : (
                                    <XCircle size={18} />
                                )}{" "}
                                Must contain exactly
                                6 digits
                            </div>

                        </div>

                        <div className={styles.group}>
                            <label>
                                Confirm Passkey
                            </label>

                            <input
                                type="password"
                                maxLength={6}
                                inputMode="numeric"
                                value={
                                    confirmPasskey
                                }
                                onChange={(e) =>
                                    setConfirmPasskey(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.button}
                        >
                            {loading
                                ? "Updating..."
                                : "Update Passkey"}
                        </button>

                    </form>

                </div>
            </div>
        </>
    );
}