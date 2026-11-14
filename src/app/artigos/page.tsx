import Link from 'next/link';
import { ARTICLES } from '@/content/articles';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';

export const metadata = {
  title: 'Artigos — Dono do Capital',
};

export default function ArtigosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm font-medium text-ink/60 hover:text-ink">
        ← Voltar
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold text-ink">Artigos</h1>
      <p className="mt-2 text-ink/70">
        Textos curtos, didáticos e baseados em dados públicos sobre desigualdade e matemática
        econômica no Brasil.
      </p>

      <div className="mt-8 space-y-4">
        {ARTICLES.map((article) => (
          <Link key={article.slug} href={`/artigos/${article.slug}`}>
            <Card className="transition-colors hover:border-capital/60">
              <CardTitle>{article.title}</CardTitle>
              <CardDescription>{article.summary}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
