"use client";

import Link from "next/link";
import { useTransition } from "react";

import { login } from "@/app/(full-width-pages)/(auth)/actions";
import Label from "@/components/form/Label";
import Spinner from "@/components/ui/spinner/Spinner";

export default function SignInForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await login(formData);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <Label>Email<span className="text-error-500">*</span></Label>
        <input
          name="email"
          type="email"
          required
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="keep-logged-in"
            disabled={isPending}
            className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="keep-logged-in" className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
            Keep me logged in
          </label>
        </div>
        <Link href="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
          Forgot password?
        </Link>
      </div>
      <button 
        type="submit" 
        disabled={isPending}
        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-500"
      >
        {isPending ? (
          <>
            <Spinner size={16} className="mr-2" colorClass="border-white" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
} 