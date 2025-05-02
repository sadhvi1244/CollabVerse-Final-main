import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Reviews", href: "/#reviews" },
    { name: "Showcase", href: "/#showcase" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const initialBgClass = transparent
    ? "bg-transparent"
    : "bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-300";

  const [bgClass, setBgClass] = useState(initialBgClass);

  // Scroll handler to add background on scroll if transparent
  const handleScroll = () => {
    if (transparent) {
      if (window.scrollY > 10) {
        setBgClass(
          "bg-white bg-opacity-80 dark:bg-zinc-800 dark:bg-opacity-80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-300"
        );
      } else {
        setBgClass("bg-zinc-200 dark:bg-zinc-800");
      }
    }
  };

  // Add scroll event listener
  useState(() => {
    if (transparent) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  });

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-colors duration-300 ${bgClass}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {location === "/" && (
              <>
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-zinc-600 hover:text-primary-600 dark:text-zinc-200 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.name}
                  </a>
                ))}
              </>
            )}

            <ThemeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarFallback>
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                    {user.profilePicture && (
                      <AvatarImage src={user.profilePicture} alt={user.name} />
                    )}
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <a className="w-full cursor-pointer">Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <a className="w-full cursor-pointer">Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">
                      <a className="w-full cursor-pointer">Settings</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth">
                  <a className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-zinc-800 dark:bg-zinc-200 bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                    Login
                  </a>
                </Link>
                <Link href="/auth">
                  <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                    Get Started
                  </a>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="ml-2"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
            {location === "/" &&
              navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}

            {user ? (
              <>
                <Link href="/dashboard">
                  <a
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </a>
                </Link>
                <Link href="/profile">
                  <a
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </a>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="px-3 py-3 flex flex-col space-y-2">
                <Link href="/auth">
                  <a
                    className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </a>
                </Link>
                <Link href="/auth">
                  <a
                    className="block w-full px-4 py-2 text-center text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </a>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
