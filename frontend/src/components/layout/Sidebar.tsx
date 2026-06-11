import Link from 'next/link';
import {
  LayoutDashboard,
  Box,
  Wrench,
  Building2,
  KeyRound,
  Ticket
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Asset Management', href: '/assets', icon: Box },
  { name: 'Preventive Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Facility Inspection', href: '/inspection', icon: Building2 },
  { name: 'Access Management', href: '/access', icon: KeyRound },
  { name: 'Ticketing', href: '/ticketing', icon: Ticket },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card flex-shrink-0 hidden md:block">
      <div className="h-full flex flex-col">
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="size-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="font-bold text-lg tracking-tight">FiberCore</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="size-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
