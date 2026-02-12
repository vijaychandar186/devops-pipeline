'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Container } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { ThemeModeToggle } from '@/components/themes/theme-mode-toggle';
import { Button } from '@/components/ui/button';

const routeList = [
  { href: '#hero', label: 'Home' },
  { href: '#features', label: 'Features' }
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2'>
          <Container className='h-5 w-5' />
          <span className='text-lg font-bold'>DevOps Pipeline</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden items-center gap-6 md:flex'>
          {routeList.map(({ href, label }) => (
            <Link
              href={href}
              key={label}
              className='text-muted-foreground hover:text-primary text-sm font-medium transition-colors'
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Section - Desktop */}
        <div className='hidden items-center gap-4 md:flex'>
          <ThemeModeToggle />
          <Button asChild>
            <Link href='/signin'>Get Started</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className='flex items-center gap-2 md:hidden'>
          <ThemeModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-[300px] sm:w-[340px]'>
              <SheetHeader>
                <SheetTitle className='flex items-center gap-2 text-left'>
                  <Container className='h-5 w-5' />
                  <span className='text-lg font-bold'>DevOps Pipeline</span>
                </SheetTitle>
              </SheetHeader>
              <nav className='mt-8 flex flex-col items-start gap-6 px-4'>
                {routeList.map(({ href, label }) => (
                  <Link
                    key={label}
                    href={href}
                    onClick={() => setIsOpen(false)}
                    className='text-muted-foreground hover:text-primary text-lg font-medium transition-colors'
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href='/signin'
                  className='w-full'
                  onClick={() => setIsOpen(false)}
                >
                  <Button className='w-full'>Go to Dashboard</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
