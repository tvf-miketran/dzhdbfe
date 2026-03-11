import React, { useState, useEffect } from "react";
import { useResetPassword } from "../hooks";
import toast from "react-hot-toast";
import axiosInstance from "../helpers/axios";

const getInitials = (fullName: string): string => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"personal" | "password">("personal");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [employeeUuid, setEmployeeUuid] = useState<string>("");

  const [formState, setFormState] = useState({
    fullName: "",
    vnFullName: "",
    employeeId: "",
    email: "",
    role: "",
    description: "",
    status: true as boolean,
  });
  // snapshot to detect changes
  const [originalState, setOriginalState] = useState({ ...formState });

  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile by UUID from localStorage
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const storedUserRaw = localStorage.getItem("user");
        const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
        const uuid = storedUser?.UUID || storedUser?.id;
        if (!uuid) { toast.error("Cannot find user UUID in local storage"); return; }
        setEmployeeUuid(uuid);
        const response = await axiosInstance.get(`/employees/${uuid}`);
        const profile = response?.data?.data ?? response?.data;
        const loaded = {
          fullName: profile?.enFullName || "",
          vnFullName: profile?.vnFullName || "",
          employeeId: profile?.employeeId || "",
          email: profile?.email || "",
          role: profile?.authorizeRole || "",
          description: profile?.description || "",
          status: profile?.status ?? true,
        };
        setFormState(loaded);
        setOriginalState(loaded);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile information");
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditStart = () => {
    setOriginalState({ ...formState });
    setIsEditMode(true);
  };

  const handleEditCancel = () => {
    setFormState({ ...originalState });
    setIsEditMode(false);
  };

  const handleSaveClick = () => setShowConfirm(true);

  const handleConfirmedUpdate = async () => {
    setIsSaving(true);
    try {
      await axiosInstance.put(`/employees/${employeeUuid}`, {
        vnFullName: formState.vnFullName,
        enFullName: formState.fullName,
        email: formState.email,
        employeeId: formState.employeeId,
        description: formState.description,
        role: formState.role,
        status: formState.status,
      });
      setOriginalState({ ...formState });
      setIsEditMode(false);
      setShowConfirm(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset password mutation
  const resetPasswordMutation = useResetPassword({
    onSuccess: (data) => {
      toast.success(data.msg || "Password reset successfully");
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  const handlePasswordSave = () => {
    if (!passwordState.currentPassword || !passwordState.newPassword || !passwordState.confirmPassword) {
      toast.error("Please fill in all password fields"); return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      toast.error("New password and confirm password do not match"); return;
    }
    if (passwordState.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters"); return;
    }
    resetPasswordMutation.mutate({ oldPassword: passwordState.currentPassword, newPassword: passwordState.newPassword });
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Profile Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 rounded-2xl border border-border-light bg-gradient-to-br from-white via-white to-slate-50 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 text-slate-700 text-2xl font-semibold flex items-center justify-center shadow-lg">
                {getInitials(formState.fullName || formState.vnFullName || "User")}
              </div>
              <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {profileLoading ? "Loading..." : formState.fullName || "User"}
              </p>
              <p className="text-sm text-slate-500 font-light">
                {profileLoading ? "Loading..." : formState.role || "User"}
              </p>
            </div>
            <div className="mt-2 w-full rounded-xl border border-dashed border-slate-200 bg-white/60 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Last Login</p>
              <p className="text-sm font-medium text-slate-700">Today, 09:24 AM</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="lg:col-span-2 rounded-2xl border border-border-light bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          {/* Tabs + Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="inline-flex w-full sm:w-auto rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => { setActiveTab("personal"); setIsEditMode(false); }}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-full transition ${activeTab === "personal" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
              >
                Personal Information
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("password"); setIsEditMode(false); }}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-full transition ${activeTab === "password" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-700"}`}
              >
                Change Password
              </button>
            </div>

            {activeTab === "personal" && (
              <div className="flex gap-2">
                {!isEditMode ? (
                  <button
                    onClick={handleEditStart}
                    disabled={profileLoading}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEditCancel}
                      className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveClick}
                      className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90"
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            )}

            {activeTab === "password" && (
              <button
                onClick={handlePasswordSave}
                disabled={resetPasswordMutation.isPending}
                className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? "Saving..." : "Save Password"}
              </button>
            )}
          </div>

          {/* Personal Info */}
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "English Full Name", key: "fullName", editable: true, type: "text" },
                { label: "Vietnamese Full Name", key: "vnFullName", editable: true, type: "text" },
                { label: "Employee ID", key: "employeeId", editable: true, type: "text" },
                { label: "Email", key: "email", editable: true, type: "email" },
                { label: "Role", key: "role", editable: true, type: "text" },
                { label: "Description", key: "description", editable: true, type: "text" },
              ].map(({ label, key, editable, type }) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{label}</label>
                  {isEditMode && editable ? (
                    <input
                      type={type}
                      value={(formState as any)[key]}
                      onChange={(e) => setFormState((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  ) : (
                    <p className="h-11 flex items-center text-sm font-medium text-slate-900 px-1 truncate">
                      {(formState as any)[key] || <span className="text-slate-400 italic">—</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Change Password */}
          {activeTab === "password" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Current Password", key: "currentPassword" },
                { label: "New Password", key: "newPassword" },
                { label: "Confirm Password", key: "confirmPassword" },
              ].map(({ label, key }) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{label}</label>
                  <input
                    type="password"
                    value={(passwordState as any)[key]}
                    onChange={(e) => setPasswordState((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Update Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isSaving && setShowConfirm(false)} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">edit_note</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Profile Update</h3>
                <p className="text-xs text-gray-500 mt-0.5">The following information will be saved</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 font-semibold text-gray-500">Field</th>
                    <th className="pb-2 font-semibold text-gray-500">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "English Full Name", value: formState.fullName },
                    { label: "Vietnamese Full Name", value: formState.vnFullName },
                    { label: "Email", value: formState.email },
                    { label: "Employee ID", value: formState.employeeId },
                    { label: "Description", value: formState.description },
                    { label: "Role", value: formState.role },
                  ].map(({ label, value }) => (
                    <tr key={label} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 font-medium text-gray-600 w-40">{label}</td>
                      <td className="py-2.5 text-gray-900 font-semibold">{value || <span className="text-gray-400 italic font-normal">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedUpdate}
                disabled={isSaving}
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg disabled:opacity-60 flex items-center gap-2"
              >
                {isSaving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {isSaving ? "Saving..." : "Confirm Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
