import React, { useState, useEffect } from "react";
import { useResetPassword, useUserProfile, useUpdateProfile } from "../hooks";
import toast from "react-hot-toast";

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"personal" | "password">(
    "personal",
  );
  const [formState, setFormState] = useState({
    fullName: "",
    vnFullName: "",
    employeeId: "",
    email: "",
    role: "",
    description: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user profile on mount
  const { data: userProfileData, isLoading: isProfileLoading } =
    useUserProfile();

  // Populate form with profile data when loaded
  useEffect(() => {
    if (userProfileData) {
      setFormState((prev) => ({
        ...prev,
        fullName: userProfileData.enFullName || "",
        vnFullName: userProfileData.vnFullName || "",
        employeeId: userProfileData.employeeId || "",
        email: userProfileData.email || "",
        role: userProfileData.authorizeRole || "",
        description: userProfileData.description || "",
      }));
    }
  }, [userProfileData]);

  // Update profile mutation
  const updateProfileMutation = useUpdateProfile({
    onSuccess: () => {
      toast.success("Personal information updated successfully");
    },
    onError: (error) => {
      toast.error(
        error.message || "Failed to update personal information"
      );
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useResetPassword({
    onSuccess: (data) => {
      toast.success(data.msg || "Password reset successfully");
      // Clear password fields
      setFormState((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  const handleSaveChanges = () => {
    if (activeTab === "password") {
      // Validate password fields
      if (
        !formState.currentPassword ||
        !formState.newPassword ||
        !formState.confirmPassword
      ) {
        toast.error("Please fill in all password fields");
        return;
      }

      if (formState.newPassword !== formState.confirmPassword) {
        toast.error("New password and confirm password do not match");
        return;
      }

      if (formState.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }

      // Call reset password API
      resetPasswordMutation.mutate({
        oldPassword: formState.currentPassword,
        newPassword: formState.newPassword,
      });
    } else {
      // Update personal info via API
      updateProfileMutation.mutate({
        name: formState.fullName,
        bio: formState.description,
      });
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Profile Management
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-2xl border border-border-light bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <img
                src="https://picsum.photos/seed/user/120/120"
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {userProfileData?.name || "Loading..."}
              </p>
              <p className="text-sm text-slate-500 font-light">
                {userProfileData?.position || userProfileData?.role || "User"}
              </p>
            </div>
            <button className="px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-white shadow-sm">
              Change Avatar
            </button>
            <div className="mt-2 w-full rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Last Login
              </p>
              <p className="text-sm font-medium text-slate-700">
                Today, 09:24 AM
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border-light bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="inline-flex w-full sm:w-auto rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-full transition ${
                  activeTab === "personal"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Personal Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-full transition ${
                  activeTab === "password"
                    ? "bg-white text-slate-900 shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Change Password
              </button>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={resetPasswordMutation.isPending || updateProfileMutation.isPending}
              className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetPasswordMutation.isPending || updateProfileMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>

          {activeTab === "personal" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  English Full Name
                </label>
                <input
                  type="text"
                  value={formState.fullName}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      fullName: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Vietnamese Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={formState.vnFullName}
                  className="w-full h-11 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 cursor-not-allowed"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  readOnly
                  value={formState.employeeId}
                  className="w-full h-11 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 cursor-not-allowed"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  readOnly
                  value={formState.email}
                  className="w-full h-11 rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-900 cursor-not-allowed"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Role/Title
                </label>
                <input
                  type="text"
                  value={formState.role}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formState.currentPassword}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={formState.newPassword}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={formState.confirmPassword}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
