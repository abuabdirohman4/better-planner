"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { handleApiError, handleAuthError } from '@/lib/errorUtils';
import { createClient } from "@/lib/supabase/server";
import { isNonEmptyString, isValidEmail } from '@/lib/typeGuards';

// redirect() bekerja dengan melempar error NEXT_REDIRECT — jangan panggil di dalam try/catch.

export async function login(formData: FormData) {
  const supabase = await createClient();

  // Type-safe form data extraction
  const email = formData.get("email");
  const password = formData.get("password");

  // Validation
  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    redirect("/signin?message=Email tidak valid");
  }

  if (!isNonEmptyString(password)) {
    redirect("/signin?message=Password tidak boleh kosong");
  }

  let errorMessage: string | undefined;
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) errorMessage = handleAuthError(error);
  } catch (error) {
    errorMessage = handleApiError(error, 'autentikasi').message || 'Gagal login';
  }

  if (errorMessage) {
    redirect(`/signin?message=${encodeURIComponent(errorMessage)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  
  // Type-safe form data extraction
  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  // Validation
  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    redirect("/signup?message=Email tidak valid");
  }

  if (!isNonEmptyString(password)) {
    redirect("/signup?message=Password tidak boleh kosong");
  }

  if (!isNonEmptyString(name)) {
    redirect("/signup?message=Nama tidak boleh kosong");
  }

  let errorMessage: string | undefined;
  let needsConfirmation = false;
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          full_name: name,
          name,
        },
      },
    });

    if (result.error) {
      errorMessage = handleAuthError(result.error);
    } else {
      // Force sign out to ensure user is not automatically signed in
      await supabase.auth.signOut();
      needsConfirmation = !!result.data.user && !result.data.user.email_confirmed_at;
    }
  } catch (error) {
    errorMessage = handleApiError(error, 'autentikasi').message || 'Gagal membuat akun';
  }

  const emailParam = `&email=${encodeURIComponent(email)}`;

  if (errorMessage) {
    redirect(`/signup?message=${encodeURIComponent(errorMessage)}${emailParam}`);
  }

  if (needsConfirmation) {
    redirect(`/signin?message=${encodeURIComponent("Please check your email to confirm your account before signing in.")}${emailParam}`);
  }

  // Email already confirmed (auto-confirm enabled)
  redirect(`/signin?message=${encodeURIComponent("Account created successfully! Please sign in with your credentials.")}${emailParam}`);
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    // Tetap lempar ke signin — perilaku lama; middleware yang jadi penentu sesi
    console.error('Sign out error:', handleApiError(error, 'autentikasi'));
  }

  redirect("/signin");
}
