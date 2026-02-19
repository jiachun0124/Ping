import React from "react";

const LoginPage = () => {
  const handleGoogleLogin = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    window.location.href = `${baseUrl}/auth/google`;
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome to Ping</h1>
        <p className="text-sm text-slate-500 mt-2">
          Sign in to browse live events.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 font-medium"
          >
            Continue with Google
          </button>
        </div>
        <div className="mt-6 text-xs text-slate-500">
          If Google login is not configured, ask for client credentials.
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
