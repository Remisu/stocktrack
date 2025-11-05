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
    const t = toast.loading(loadingMessages[mode]);
    try {
      if (mode === "login") {
        const res = await api.post("/api/auth/login", data);
        setToken(res.data.token);
        toast.success("Welcome!", { id: t });
        onLogin();
      } else if (mode === "register") {
        await api.post("/api/auth/register", data);
        toast.success("Account created! Please sign in.", { id: t });
        reset({ email: data.email, password: "" });
        setMode("login");
      } else {
        await api.post("/api/auth/reset-password", data);
        toast.success("Password updated! Please sign in.", { id: t });
        reset({ email: data.email, password: "" });
        setMode("login");
      }
    } catch (e) {
      const errorMessages = {
        login: "Incorrect email or password.",
        register: "Could not create account.",
        reset: "Could not reset password.",
      };
      toast.error(errorMessages[mode], { id: t });
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
      fontFamily: "system-ui",
    }}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          background: "#fff",
          padding: "2.5rem",
          borderRadius: "1rem",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
        }}>
          <button
            type="button"
            onClick={() => handleModeChange("login")}
            style={{
              border: "none",
              background: mode === "login" ? "#e0f2fe" : "transparent",
              color: mode === "login" ? "#0284c7" : "#475569",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("register")}
            style={{
              border: "none",
              background: mode === "register" ? "#e0f2fe" : "transparent",
              color: mode === "register" ? "#0284c7" : "#475569",
              padding: "0.5rem 1rem",
              borderRadius: "9999px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Register
          </button>
        </div>

        <h1 style={{
          textAlign: "center",
          marginBottom: "0.5rem",
          color: "#1e3a8a",
        }}>{title}</h1>
        <p style={{ textAlign: "center", color: "#6b7280" }}>{subtitle}</p>

        <input
          type="email"
          placeholder="Email"
          {...register("email")}
          style={{
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
            outline: "none",
            fontSize: "1rem"
          }}
        />
        {errors.email && <small style={{ color: "crimson" }}>{errors.email.message}</small>}

        <input
          type="password"
          placeholder="Password"
          {...register("password")}
          style={{
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
            outline: "none",
            fontSize: "1rem"
          }}
        />
        {errors.password && <small style={{ color: "crimson" }}>{errors.password.message}</small>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: "#0ea5e9",
            color: "#fff",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            border: "none",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#0284c7")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#0ea5e9")}
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
              color: "#0284c7",
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
              color: "#0284c7",
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
