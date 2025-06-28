import { login } from "@/app/auth/actions";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Link from "next/link";
import { useRef } from "react";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      // @ts-ignore
      await login(formData);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center">
      <ComponentCard title="Login">
        <form className="grid gap-4" ref={formRef} onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" />
          </div>
          {searchParams?.message && (
            <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center">
              {searchParams.message}
            </p>
          )}
          <Button className="w-full">
            <span>Login</span>
          </Button>
          <div className="text-center text-sm mt-2">
            Belum punya akun?{" "}
            <Link href="/signup" className="underline">
              Sign Up
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
