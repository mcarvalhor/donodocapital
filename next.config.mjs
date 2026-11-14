/** @type {import('next').NextConfig} */
const nextConfig = {
  // Site 100% estático: nenhuma rota usa API Routes, Server Actions, middleware,
  // cookies()/headers() ou next/image. A simulação inteira roda no navegador (motor
  // puro em `src/core/math`), e o estado é sincronizado via URL — por isso o app
  // pode ser exportado como HTML/CSS/JS estáticos e servido por qualquer servidor
  // de arquivos (ex.: Nginx em Alpine via o Dockerfile deste repositório), sem
  // Node.js em produção. `npm run build` já gera a pasta `out/` pronta para deploy.
  output: 'export',
  // Gera `pagina/index.html` em vez de `pagina.html` — formato mais portável para
  // servidores estáticos (Nginx, Apache, S3) servirem com a diretiva `index` padrão,
  // sem precisar de regras de rewrite customizadas para remover a extensão `.html`.
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    dirs: ['src'],
  },
};

export default nextConfig;
