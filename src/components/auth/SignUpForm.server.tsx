import { signup } from "@/app/(full-width-pages)/(auth)/actions";
import Label from "@/components/form/Label";

export default function SignUpForm({ error, defaultEmail }: { error?: string | null, defaultEmail?: string }) {
  // Check if message is success or error
  const isSuccess = error && (
    error.includes("Account created successfully") ||
    error.includes("Please check your email") ||
    error.includes("successfully")
  );

  return (
    <>
      {error ? <div className={`mb-4 p-3 rounded text-center ${
          isSuccess 
            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" 
            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        }`}>
          {error}
        </div> : null}
      <form action={signup} className="space-y-5">
        <div>
          <Label>Email<span className="text-error-500">*</span></Label>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
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
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="terms-agree"
            required
            className="w-4 h-4"
          />
          <label htmlFor="terms-agree" className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
            By creating an account you agree to the <a href="#" className="underline">Terms and Conditions</a> and <a href="#" className="underline">Privacy Policy</a>.
          </label>
        </div>
        <button type="submit" className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600">
          Sign Up
        </button>
      </form>
    </>
  );
} 