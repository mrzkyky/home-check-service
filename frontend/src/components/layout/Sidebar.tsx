import Link from 'next/link';
import {
  LayoutDashboard,
  Box,
  Wrench,
  Building2,
  KeyRound,
  Ticket,
  ShieldCheck,
  Server
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Approval Center', href: '/approvals', icon: ShieldCheck },
  { name: 'Asset Management', href: '/assets', icon: Server },
  { name: 'Preventive Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Facility Inspection', href: '/inspection', icon: Building2 },
  { name: 'Access Management', href: '/access', icon: KeyRound },
  { name: 'Ticketing', href: '/ticketing', icon: Ticket },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-border/50 bg-background/50 backdrop-blur-sm flex-shrink-0 hidden md:block z-40 shadow-xl">
      <div className="h-full flex flex-col">
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">FiberCore</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="px-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                  >
                    <Icon className="size-5 group-hover:scale-110 transition-transform" />
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
