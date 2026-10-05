import { LoginShell } from "./login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginShell />
    </Suspense>
  );
}
