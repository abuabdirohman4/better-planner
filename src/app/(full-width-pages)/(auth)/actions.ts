"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-safe-next-auth
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return redirect("/signin?message=Could not authenticate user");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };
  
  const result = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (result.error) {
    return redirect(`/signup?message=${encodeURIComponent(result.error.message)}&email=${encodeURIComponent(data.email)}`);
  }

  // Force sign out to ensure user is not automatically signed in
  await supabase.auth.signOut();

  // Check if user needs email confirmation
  if (result.data.user && !result.data.user.email_confirmed_at) {
    // User needs to confirm email
    return redirect(`/signin?message=${encodeURIComponent("Please check your email to confirm your account before signing in.")}&email=${encodeURIComponent(data.email)}`);
  }

  // If email is already confirmed (auto-confirm enabled), redirect to signin with success message
  return redirect(`/signin?message=${encodeURIComponent("Account created successfully! Please sign in with your credentials.")}&email=${encodeURIComponent(data.email)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signin");
} 