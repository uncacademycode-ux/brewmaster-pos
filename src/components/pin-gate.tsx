import { useState, type ReactNode, type FormEvent } from "react";
import { Coffee, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCESS_CODE = "123123";
const STORAGE_KEY = "brewhouse-access";

export function PinGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setCode("");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Coffee className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">Brew House</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accès réservé au personnel — entrez votre code
          </p>
        </div>

        <label className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4" /> Code d'accès
        </label>
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="••••••"
          className="text-center text-lg tracking-widest"
        />
        {error && (
          <p className="mt-2 text-sm text-destructive">Code incorrect. Réessayez.</p>
        )}

        <Button type="submit" className="mt-4 w-full" size="lg">
          Déverrouiller
        </Button>
      </form>
    </div>
  );
}
