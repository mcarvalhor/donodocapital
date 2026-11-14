'use client';

import * as React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export interface DialogContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Modal acessível (Radix Dialog) com título, descrição opcional e botão de fechar. */
export function DialogContent({ title, description, children, className }: DialogContentProps) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
      <RadixDialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-paper p-5 shadow-xl focus:outline-none',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <RadixDialog.Title className="font-serif text-base font-semibold text-ink">
            {title}
          </RadixDialog.Title>
          <RadixDialog.Close asChild>
            <button
              type="button"
              aria-label="Fechar"
              className="shrink-0 rounded-full p-1 text-ink/50 hover:bg-ink/5 hover:text-ink"
            >
              <X size={18} />
            </button>
          </RadixDialog.Close>
        </div>
        {description && (
          <RadixDialog.Description className="mt-1 text-xs text-ink/60">
            {description}
          </RadixDialog.Description>
        )}
        <div className="mt-4">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
