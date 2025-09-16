"use client";

import { useTransition } from "react";

import { signup } from "@/app/(full-width-pages)/(auth)/actions";
import Label from "@/components/form/Label";
import Spinner from "@/components/ui/spinner/Spinner";

export default function SignUpForm({ error, defaultEmail }: { error?: string | null, defaultEmail?: string }) {
  const [isPending, startTransition] = useTransition();

  // Check if message is success or error
  const isSuccess = error && (
    error.includes("Account created successfully") ||
    error.includes("Please check your email") ||
    error.includes("successfully")
  );

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await signup(formData);
    });
  };

  return (
    <>
      {error ? <div className={`mb-4 p-3 rounded text-center ${
          isSuccess 
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {error}
        </div> : null}
      <form action={handleSubmit} className="space-y-5">
        <div>
          <Label>Email<span className="text-error-500">*</span></Label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            disabled={isPending}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <Label>Password<span className="text-error-500">*</span></Label>
          <input
            name="password"
            type="password"
            required
            disabled={isPending}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Enter your password"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="terms-agree"
            required
            disabled={isPending}
            className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="terms-agree" className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
            By creating an account you agree to the <button type="button" className="underline text-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 rounded">Terms and Conditions</button> and <button type="button" className="underline text-brand-500 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1 rounded">Privacy Policy</button>.
          </label>
        </div>
        <button 
          type="submit" 
          disabled={isPending}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-500"
        >
          {isPending ? (
            <>
              <Spinner size={16} className="mr-2" />
              Creating Account...
            </>
          ) : (
            "Sign Up"
          )}
        </button>
      </form>
    </>
  );
} 