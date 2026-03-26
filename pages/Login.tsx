import React, { useState } from "react";
import { useLogin } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../helpers/axios";
import toast from "react-hot-toast";
import { User } from "../types";

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
    <div className="relative flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,23,42,0.06),transparent_55%)]" />
      </div>

      {/* Left side - Login Form */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="mb-4 flex aspect-square h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                <span className="material-symbols-outlined fill-1 text-[32px]">
                  grid_view
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Techvify
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back. Please sign in to continue.
              </p>
            </div>

            {/* Error Message */}
            {loginMutation.isError && (
              <div className="rounded-2xl border border-red-200/70 bg-red-50/80 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-700 text-[20px] mt-0.5">
                    error
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">
                      Login Failed
                    </p>
                    <p className="text-xs text-red-900/80 mt-1">
                      {loginMutation.error?.message ||
                        "Invalid email or password. Please try again."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-transparent bg-slate-50 text-slate-900 placeholder-slate-400 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    placeholder="your.name@techvify.com.vn"
                    pattern="^[A-Za-z0-9._%+-]+@techvify\.com\.vn$"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
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
                    className={`w-full h-12 pl-11 pr-11 rounded-xl border bg-slate-50 text-slate-900 placeholder-slate-400 outline-none ring-1 focus:ring-2 transition-all ${
                      passwordError
                        ? "border-red-300 ring-red-200 focus:ring-red-300"
                        : "border-transparent ring-slate-200 focus:ring-primary/40 focus:border-primary"
                    }`}
                    placeholder="123456"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-600"
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

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-2 cursor-pointer"
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    Remember me
                  </span>
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 mt-8">
              By signing in, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="relative hidden lg:flex lg:flex-1 items-center justify-center p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(59,130,246,0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.2),transparent_45%)]" />

        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-semibold mb-6">
            Enterprise-ready workspace
          </h2>
          <p className="text-lg text-blue-100/90 mb-8">
            Centralize project oversight, align teams, and keep delivery
            predictable with a dashboard built for scale.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-blue-100/70">
                Active
              </p>
              <p className="text-2xl font-semibold mt-2">42</p>
              <p className="text-xs text-blue-100/70">Projects</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-blue-100/70">
                Teams
              </p>
              <p className="text-2xl font-semibold mt-2">18</p>
              <p className="text-xs text-blue-100/70">Squads</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-widest text-blue-100/70">
                Uptime
              </p>
              <p className="text-2xl font-semibold mt-2">99.9%</p>
              <p className="text-xs text-blue-100/70">Reliability</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <span className="material-symbols-outlined text-[22px]">
                  insights
                </span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Operational insights</h3>
                <p className="text-sm text-blue-100/80">
                  Monitor project health, velocity, and delivery risk.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <span className="material-symbols-outlined text-[22px]">
                  group
                </span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Resource visibility</h3>
                <p className="text-sm text-blue-100/80">
                  Balance staffing needs with demand in real time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2">
                <span className="material-symbols-outlined text-[22px]">
                  verified
                </span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure by design</h3>
                <p className="text-sm text-blue-100/80">
                  Compliance-ready access control and audit trails.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-16 right-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-16 left-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>
    </div>
  );
};

export default Login;
