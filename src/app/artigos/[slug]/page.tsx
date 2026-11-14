import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ARTICLES, getArticle } from '@/content/articles';

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  return { title: article ? `${article.title} — Dono do Capital` : 'Artigo não encontrado' };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/artigos" className="text-sm font-medium text-ink/60 hover:text-ink">
        ← Todos os artigos
      </Link>
      <article className="prose prose-neutral mt-6 max-w-none">
        <h1 className="font-serif text-3xl font-bold text-ink">{article.title}</h1>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </article>
    </main>
  );
}
