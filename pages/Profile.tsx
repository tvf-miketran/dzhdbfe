import React, { useState } from 'react';

const Profile: React.FC = () => {
  const [formState, setFormState] = useState({
    fullName: 'Alex Morgan',
    role: 'ODC Lead',
    projectName: 'Alpha ODC Platform',
    pm: 'Emily Blunt'
  });

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Profile Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border border-border-light bg-surface-light p-6 shadow-lg">
          <div className="flex flex-col items-center text-center gap-4">
            <img
              src="https://picsum.photos/seed/user/120/120"
              alt="Profile"
              className="h-24 w-24 rounded-full border border-border-light object-cover"
            />
            <div>
              <p className="text-lg font-semibold text-slate-900">Alex Morgan</p>
              <p className="text-sm text-slate-500 font-light">ODC Lead</p>
            </div>
            <button className="px-4 py-2 rounded-md border border-border-light text-sm font-semibold text-slate-700 hover:bg-slate-100">
              Change Avatar
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border-light bg-surface-light p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
            <button className="px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90">
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Full Name</label>
              <input
                type="text"
                value={formState.fullName}
                onChange={(event) => setFormState((prev) => ({ ...prev, fullName: event.target.value }))}
                className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Title</label>
              <input
                type="text"
                value={formState.role}
                onChange={(event) => setFormState((prev) => ({ ...prev, role: event.target.value }))}
                className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Project Name</label>
              <input
                type="text"
                value={formState.projectName}
                onChange={(event) => setFormState((prev) => ({ ...prev, projectName: event.target.value }))}
                className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">PM</label>
              <input
                type="text"
                value={formState.pm}
                onChange={(event) => setFormState((prev) => ({ ...prev, pm: event.target.value }))}
                className="w-full h-10 rounded-lg border border-border-light bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
