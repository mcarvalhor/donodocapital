import Link from 'next/link';
import { PRESET_LIST } from '@/data/presets';
import { runSimulation } from '@/core/math/engine';
import { formatBRL, formatCompactBRL } from '@/utils/formatters';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';
import { presetToQueryString } from '@/components/simulator/presetToQueryString';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:py-20">
      <section className="text-center">
        <Logo className="justify-center" />
        <h1 className="mx-auto mt-6 max-w-3xl font-serif text-3xl font-bold leading-tight text-ink sm:text-5xl">
          Dinheiro e trabalho não jogam o mesmo jogo matemático.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-ink/70 sm:text-lg">
          Simule sua trajetória financeira dos 18 aos 65 anos e veja, com matemática transparente,
          por que quando <strong>r &gt; g</strong> — o retorno do capital supera o crescimento dos
          salários — o dinheiro de quem já tem patrimônio cresce sozinho, enquanto quem depende do
          próprio trabalho enfrenta uma barreira matemática real.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/simulador">Simular minha trajetória</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/artigos">Entender a matemática</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 text-center font-serif text-2xl font-semibold text-ink">
          Seis trajetórias, a mesma matemática
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRESET_LIST.map((preset) => {
            const result = runSimulation(preset);
            return (
              <Card key={preset.id}>
                <CardTitle>{preset.label}</CardTitle>
                <CardDescription>
                  Patrimônio inicial: {formatCompactBRL(preset.initialWealth)} · Salário:{' '}
                  {formatCompactBRL(preset.monthlySalary)}/mês
                </CardDescription>
                <p className="mt-4 font-serif text-xl font-bold text-ink">
                  {formatBRL(result.summary.finalWealth)}
                  <span className="ml-2 text-sm font-normal text-ink/50">
                    aos {preset.targetAge} anos
                  </span>
                </p>
                <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
                  <Link href={`/simulador?${presetToQueryString(preset)}`}>
                    Ver simulação completa →
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
