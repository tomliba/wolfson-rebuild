'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, Scissors, Film, Users, LogOut, Menu, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/', label: 'דשבורד', icon: LayoutDashboard },
  { href: '/tasks', label: 'מטלות', icon: ClipboardCheck },
  { href: '/surgeries', label: 'ניתוחים', icon: Scissors },
  { href: '/videos', label: 'סרטי ניתוחים', icon: Film },
];

const adminItems = [
  { href: '/admin', label: 'ניהול מתמחים', icon: Users },
];

export default function AppShell({ user, profile, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;
  const displayName = profile?.full_name || user.email;
  const initial = profile?.full_name?.[0] || user.email[0];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Mobile Header - matches Layout.jsx.txt:34-42 */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground text-sm">הכשרת קטרקט</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* Mobile Nav Sheet - replaces Layout.jsx.txt:44-73 overlay with shadcn Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-64 p-0">
          <SheetTitle className="sr-only">תפריט ניווט</SheetTitle>
          <nav className="p-3 space-y-1 mt-8">
            {allItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - matches Layout.jsx.txt:76-127 */}
      <aside className="hidden md:flex fixed top-0 right-0 bottom-0 w-56 flex-col bg-sidebar border-l border-sidebar-border z-30">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Eye className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-sidebar-foreground">הכשרת קטרקט</h1>
              <p className="text-[10px] text-sidebar-foreground/60">מעקב התמחות</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {allItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                isActive(item.href)
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-bold text-sidebar-primary">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-foreground/50">{isAdmin ? 'מנהל' : 'מתמחה'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            התנתק
          </button>
        </div>
      </aside>

      {/* Main Content - matches Layout.jsx.txt:130-132 */}
      <main className="md:mr-56 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
