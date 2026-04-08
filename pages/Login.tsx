import React, { useState } from "react";
import { useLogin } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../helpers/axios";
import toast from "react-hot-toast";
import { User } from "../types";
import logoColor from "../img/techvify_logo_ver2.png";

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(0,96,255,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_30%),linear-gradient(135deg,#f9fbff_0%,#eff6ff_42%,#dbeafe_100%)] px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-[#0060ff]/12 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-sky-400/18 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.45),transparent_45%)]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_28px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:p-10">
          <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-[#0060ff]/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-sky-200/50 blur-3xl" />

          <div className="relative mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="relative flex h-17 w-17 items-center justify-center rounded-[1.25rem] border border-[#0060ff]/15 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_45%),linear-gradient(135deg,#0a2e6d_0%,#0060ff_100%)] p-2 shadow-[0_12px_30px_rgba(0,96,255,0.28)] ring-1 ring-white/20">
              <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] ring-1 ring-white/15" />
              <img
                src={logoColor}
                alt="Techvify logo"
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(255,255,255,0.15)]"
              />
            </div>
            <div className="sm:pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0060ff]">
                Techvify
              </p>
              <h1 className="mt-1 text-2xl font-semibold uppercase tracking-[0.14em] text-slate-900 sm:text-[1.9rem]">
                LOGIN
              </h1>
              <div className="mt-2 h-0.5 w-14 rounded-full bg-gradient-to-r from-[#0060ff] to-sky-400" />
            </div>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-slate-900 placeholder-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none ring-1 ring-transparent transition-all focus:border-[#0060ff] focus:ring-2 focus:ring-[#0060ff]/20"
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
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
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
                  className={`h-12 w-full rounded-xl border bg-white pl-11 pr-11 text-slate-900 placeholder-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none ring-1 transition-all ${
                    passwordError
                      ? "border-red-300 ring-red-200 focus:border-red-400 focus:ring-red-300/40"
                      : "border-slate-200 ring-transparent focus:border-[#0060ff] focus:ring-2 focus:ring-[#0060ff]/20"
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
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#0060ff] via-[#0057e6] to-[#1d4ed8] font-semibold text-white shadow-lg shadow-[#0060ff]/25 transition-all hover:brightness-105 hover:shadow-[#0060ff]/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

          <p className="mt-8 text-center text-xs text-slate-500">
            By signing in, you agree to our{" "}
            <a href="#" className="font-medium text-[#0060ff] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="font-medium text-[#0060ff] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
