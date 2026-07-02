import { SignupForm } from "@/components/auth/auth-forms";
import { Globe } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function SignupPage() {
  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700">
          <Globe className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Meridian</h1>
          <p className="text-sm text-muted-foreground">PLNITUDE Client Ops</p>
        </div>
      </div>
      <SignupForm />
      <Toaster />
    </div>
  );
}
