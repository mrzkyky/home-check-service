import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  return (
    <header className="h-16 border-b border-border/50 bg-background/40 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Search / Left Side */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 max-w-md hidden md:flex items-center group">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Search assets, tickets, or users..."
            className="flex h-10 w-full rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-sm shadow-sm transition-all focus:bg-background focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 pl-10 outline-none"
          />
        </div>
      </div>

      {/* Right Side / Actions */}
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="relative size-8 rounded-full hover:opacity-80 transition-opacity cursor-pointer">
              <Avatar className="size-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin EOMS</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@fibercore.local
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
