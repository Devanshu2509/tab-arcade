import { Outlet, Link } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Header */}
      <header className="w-full border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-textMain hover:text-accent transition-colors">
            <Gamepad2 className="w-6 h-6" />
            <span className="font-display font-black text-xl tracking-tight">TabArcade</span>
          </Link>
          <div className="text-sm font-medium text-textMuted">
            Beta v0.1
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12">
        <Outlet />
      </main>
    </div>
  );
}