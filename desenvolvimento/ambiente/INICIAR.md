# Inicialização do ambiente

Use somente `/workspace/GUARDIAO_DA_NATUREZA` para este projeto. A tarefa na nuvem já é isolada: mantenha o checkout existente e não crie worktrees sem pedido explícito. Preserve as pastas e artes atuais. A antiga pasta `beta/` foi removida pelo usuário e não deve ser recriada como parte da instalação.

1. Use Node.js 24 LTS. Na raiz, confirme a presença de `package-lock.json`. Se `node_modules/` não estiver disponível, execute `npm ci`. O cache npm do projeto fica em `.cache/npm`.
2. Execute `npm run check:tools`. Se os editores não estiverem disponíveis, execute `npm run tools:install`. O instalador usa os destinos oficiais já permitidos: registry.npmjs.org, github.com, release-assets.githubusercontent.com, deb.debian.org e security.debian.org. Não precisa de novos segredos.
3. Inicie `npm run dev` na raiz e mantenha o processo ativo. O Vite usa a porta 5173. Se estiver ocupada, confira o serviço existente e use outra porta com `npm run dev -- --port 5174`; não encerre processos de outras tarefas.
4. Verifique internamente uma resposta HTTP de `/tela-inicial/nova-versao/index.html` e de `/desenvolvimento/laboratorio/index.html` no servidor iniciado. A raiz redireciona ao menu. Para validar o funcionamento completo, `npm test` inicia seu próprio servidor e verifica a animação real de Kai, GSAP, pausa, celular, transições, mapa, colar e folhas. `npm run build` seguido de `npm run test:build` verifica o resultado compilado.
5. Não forneça links de loopback como prévias ao usuário durante o onboarding. Relate o resultado das verificações em texto.

O laboratório é separado do produto: o botão Jogar abre a seleção de fases aprovada. A prévia de recuperação do mapa não representa uma fase jogável concluída. Não altere o progresso real para verificar a instalação. O favicon continua sendo o rosto da Flora.

Dependências e arquivos podem ser retidos no ambiente, mas processos não. Reinicie o Vite em novas tarefas. A configuração salva precisa ser publicada pela plataforma para gerar uma nova versão do ambiente; salvar scripts não publica nem inicia servidores. A instalação nesta máquina não instala editores no computador pessoal do usuário.
