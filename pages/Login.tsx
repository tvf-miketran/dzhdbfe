import React, { useState } from "react";
import { useLogin } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../helpers/axios";
import toast from "react-hot-toast";
import { User } from "../types";
import logoIcon from "../img/techvify_icon.ico";

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { login } = useAuth();

  // Use the login mutation hook
  const loginMutation = useLogin({
    onSuccess: (data) => {
      const refreshToken =
        data.user.refresh_token ||
        data.user.refreshToken ||
        data.refresh_token ||
        data.refreshToken;

      // Store token and user in auth context
      login(data.user.access_token, data.user.user, refreshToken);

      // Redirect by role
      onLogin(data.user.user);
    },
    onError: (error: ApiError) => {
      // Show error toast with message from API response
      // toast.error(
      //   error.message || "Login failed. Please check your credentials.",
      // );
      console.error("Login failed:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setPasswordError("");

    // Call the login mutation
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(0,96,255,0.12),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_40%,#f8fafc_100%)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-[#0060ff]/10 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[20rem] w-[20rem] rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute inset-0 opacity-40 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_45px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#0060ff]/15 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_45%),linear-gradient(135deg,#0a2e6d_0%,#0060ff_100%)] p-2 shadow-[0_10px_24px_rgba(0,96,255,0.25)]">
              <img
                src={logoIcon}
                alt="Techvify logo"
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(255,255,255,0.15)]"
              />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#0060ff]">
              Techvify
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-[0.08em] text-slate-900">
              LOGIN
            </h1>
          </div>

          {loginMutation.isError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/90 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-red-600">
                  error
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Login Failed
                  </p>
                  <p className="mt-1 text-xs text-red-900/80">
                    {loginMutation.error?.message ||
                      "Invalid email or password. Please try again."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[19px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-11 pr-4 text-slate-900 placeholder-slate-400 outline-none ring-1 ring-transparent transition-all focus:border-[#0060ff] focus:bg-white focus:ring-2 focus:ring-[#0060ff]/20"
                  placeholder="your.name@techvify.com.vn"
                  pattern="^[A-Za-z0-9._%+-]+@techvify\.com\.vn$"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[19px]">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setPassword(nextValue);
                    if (passwordError && nextValue.length >= 6) {
                      setPasswordError("");
                    }
                  }}
                  className={`h-12 w-full rounded-xl border bg-slate-50/60 pl-11 pr-11 text-slate-900 placeholder-slate-400 outline-none ring-1 transition-all ${
                    passwordError
                      ? "border-red-300 ring-red-200 focus:border-red-400 focus:ring-red-300/40"
                      : "border-slate-200 ring-transparent focus:border-[#0060ff] focus:bg-white focus:ring-2 focus:ring-[#0060ff]/20"
                  }`}
                  placeholder="123456"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[20px] leading-none">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {passwordError && (
                <p className="mt-2 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 h-12 w-full rounded-xl bg-[#0060ff] font-semibold text-white shadow-lg shadow-[#0060ff]/22 transition-all hover:bg-[#0057e6] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
