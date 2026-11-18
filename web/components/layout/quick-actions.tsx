'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarPlus, FilePlus2, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui';

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const items = [
    { href: '/leads?nuevo=1', label: 'Nuevo lead', icon: UserPlus },
    { href: '/cotizaciones/nueva', label: 'Nueva cotización', icon: FilePlus2 },
    { href: '/leads?seguimiento=1', label: 'Registrar seguimiento', icon: CalendarPlus },
  ];
  return (
    <div className="relative">
      <Button onClick={() => setOpen((value) => !value)} className="hidden sm:inline-flex">
        <Plus className="h-4 w-4" /> Acciones rápidas
      </Button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-line bg-white p-1 shadow-lg" onMouseLeave={() => setOpen(false)}>
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
            >
              <item.icon className="h-4 w-4 text-muted" /> {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
