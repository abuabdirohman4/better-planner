import Link from "next/link";

import { login } from "@/app/(full-width-pages)/(auth)/actions";
import Label from "@/components/form/Label";

export default function SignInForm() {
  return (
    <form action={login} className="space-y-6">
      <div>
        <Label>Email<span className="text-error-500">*</span></Label>
        <input
          name="email"
          type="email"
          required
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Enter your email"
        />
      </div>
      <div>
        <Label>Password<span className="text-error-500">*</span></Label>
        <input
          name="password"
          type="password"
          required
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Enter your password"
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="keep-logged-in"
            className="w-4 h-4"
          />
          <label htmlFor="keep-logged-in" className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
            Keep me logged in
          </label>
        </div>
        <Link href="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
          Forgot password?
        </Link>
      </div>
      <button type="submit" className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
        Sign In
      </button>
    </form>
  );
} 