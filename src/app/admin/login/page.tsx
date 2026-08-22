"use client";

import { useState, useActionState } from "react";
import { loginAction, type LoginState } from "../actions";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Authenticating..." : "Sign In to Dashboard"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, { error: "" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-neutral-200 flex items-center justify-center">
            <LockKeyhole className="w-8 h-8 text-[#2563EB]" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-neutral-900 tracking-tight">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Secure access for authorized personnel only
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-neutral-200/50 sm:rounded-xl sm:px-10 border border-neutral-100">
          
          {state?.error && (
            <div 
              role="alert" 
              aria-live="polite" 
              className="bg-red-50/80 border border-red-100 text-red-600 p-3.5 rounded-lg mb-6 text-sm flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
              {state.error}
            </div>
          )}
          
          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  autoFocus
                  className="appearance-none block w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-[#2563EB] focus:border-[#2563EB] sm:text-sm pr-10 transition-colors"
                  placeholder="Enter administrator password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <LoginButton />
          </form>
        </div>
      </div>
    </div>
  );
}
