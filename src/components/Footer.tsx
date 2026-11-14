import Link from 'next/link';
import { LogoMark } from '@/components/Logo';

/** Rodapé global, exibido ao final de todas as páginas (ver `src/app/layout.tsx`). */
export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-5 py-10 text-center text-xs text-ink/50">
      <LogoMark className="mx-auto mb-3 h-6 w-6 opacity-70" />
      <p>
        Mantido por{' '}
        <a
          href="https://mcarvalhor.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink/70 underline underline-offset-2 hover:text-ink"
        >
          mcarvalhor
        </a>{' '}
        |{' '}
        <a
          href="https://github.com/mcarvalhor/donodocapital"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink/70 underline underline-offset-2 hover:text-ink"
        >
          GitHub
        </a>{' '}
        |{' '}
        <Link
          href="/apoie"
          className="font-medium text-ink/70 underline underline-offset-2 hover:text-ink"
        >
          Apoie este projeto 🍦
        </Link>
      </p>
    </footer>
  );
}
