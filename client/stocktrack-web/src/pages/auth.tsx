import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(4, "Password is too short"),
});

type FormData = z.infer<typeof schema>;

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const loadingMessages = {
      login: "Signing in...",
      register: "Creating account...",
      reset: "Updating password...",
    };
    const TOAST_DURATION = 6500;
    const t = toast.loading(loadingMessages[mode]);
    try {
      if (mode === "login") {
        const res = await api.post("/api/auth/login", data);
        setToken(res.data.token);
        toast.success("Welcome!", { id: t, duration: TOAST_DURATION });
        onLogin();
      } else if (mode === "register") {
        await api.post("/api/auth/register", data);
        toast.success("Account created! Please sign in.", { id: t, duration: TOAST_DURATION });
        reset({ email: data.email, password: "" });
        setMode("login");
      } else {
        await api.post("/api/auth/reset-password", data);
        toast.success("Password updated! Please sign in.", { id: t, duration: TOAST_DURATION });
        reset({ email: data.email, password: "" });
        setMode("login");
      }
    } catch (e) {
      const errorMessages = {
        login: "Incorrect email or password.",
        register: "Could not create account.",
        reset: "Could not reset password.",
      };
      toast.error(errorMessages[mode], { id: t, duration: TOAST_DURATION });
    }
  };

  const handleModeChange = (nextMode: "login" | "register" | "reset") => {
    reset({ email: "", password: "" });
    setMode(nextMode);
  };

  const submitLabel = {
    login: isSubmitting ? "Signing in..." : "Sign in",
    register: isSubmitting ? "Registering..." : "Register",
    reset: isSubmitting ? "Resetting..." : "Reset password",
  }[mode];

  const title = mode === "register"
    ? "Create your account"
    : mode === "reset"
      ? "Reset password"
      : "StockTrack";

  const subtitle = mode === "register"
    ? "Fill in your details to get started"
    : mode === "reset"
      ? "Enter your email and a new password"
      : "Sign in to continue";

  return (
    <div className="auth-screen">
      <form onSubmit={handleSubmit(onSubmit)} className="auth-card">
        <div className="auth-card__switcher">
          <button
            type="button"
            onClick={() => handleModeChange("login")}
            className={mode === "login" ? "is-active" : undefined}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("register")}
            className={mode === "register" ? "is-active" : undefined}
          >
            Register
          </button>
        </div>

        <h1 style={{ textAlign: "center", marginBottom: "0.5rem", color: "var(--color-heading)" }}>{title}</h1>
        <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>{subtitle}</p>

        <input
          type="email"
          placeholder="Email"
          {...register("email")}
          style={{
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-input-border)",
            background: "var(--color-input-bg)",
            color: "var(--color-text)",
            outline: "none",
            fontSize: "1rem"
          }}
        />
        {errors.email && <small style={{ color: "var(--color-danger)" }}>{errors.email.message}</small>}

        <input
          type="password"
          placeholder="Password"
          {...register("password")}
          style={{
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid var(--color-input-border)",
            background: "var(--color-input-bg)",
            color: "var(--color-text)",
            outline: "none",
            fontSize: "1rem"
          }}
        />
        {errors.password && <small style={{ color: "var(--color-danger)" }}>{errors.password.message}</small>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-button"
        >
          {submitLabel}
        </button>
        {mode !== "reset" ? (
          <button
            type="button"
            onClick={() => handleModeChange("reset")}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--color-accent-strong)",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "0.9rem",
            }}
          >
            Forgot your password?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleModeChange("login")}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--color-accent-strong)",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "0.9rem",
            }}
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}
