import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader({ authed = false }: { authed?: boolean }) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">ResumeForge</span>
        </Link>

        <nav className="flex items-center gap-2">
          {authed ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">My resumes</Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
