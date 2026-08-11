const { useMemo } = React;

function SectionHeader({ title, subtitle }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <p className="section-intro">{subtitle}</p>
    </section>
  );
}

function InfoCard({ title, text, icon }) {
  return (
    <article className="feature-card">
      <div className="step-icon">{icon}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-text">{text}</p>
    </article>
  );
}

function StepCard({ icon, step, description }) {
  return (
    <article className="step-card">
      <div className="step-icon">{icon}</div>
      <strong>{step}</strong>
      <p>{description}</p>
    </article>
  );
}

function App() {
  const stats = useMemo(
    () => [
      { value: '3', label: 'categorias de descarte' },
      { value: '5+', label: 'tipos de materiais' },
      { value: '100%', label: 'foco em sustentabilidade' },
    ],
    [],
  );

  const categories = useMemo(
    () => [
      {
        icon: '♻️',
        title: 'Reciclável',
        text: 'Papel, plástico, vidro e metal que podem voltar à indústria após a coleta e triagem.',
      },
      {
        icon: '🔁',
        title: 'Reutilizável',
        text: 'Objetos e embalagens que ainda têm vida útil e podem ser doados ou reaproveitados.',
      },
      {
        icon: '🍃',
        title: 'Orgânico',
        text: 'Resíduos de cozinha e jardim que se transformam em adubo para plantas saudáveis.',
      },
    ],
    [],
  );

  const impactItems = useMemo(
    () => [
      {
        title: 'Menos lixo em aterros',
        text: 'Reciclar reduz a quantidade de resíduos em aterros, preservando solo e água.',
      },
      {
        title: 'Economia de recursos',
        text: 'Reutilizar materiais poupa energia, água e a extração de matéria-prima natural.',
      },
      {
        title: 'Mais verde para cidades',
        text: 'Ao reduzir o desperdício, damos espaço para áreas verdes e plantas prosperarem.',
      },
    ],
    [],
  );

  const decomposicao = useMemo(
    () => [
      { material: 'Papel', tempo: '2 a 6 meses' },
      { material: 'Plástico', tempo: '200 a 450 anos' },
      { material: 'Vidro', tempo: '1 milhão+ anos' },
      { material: 'Metal', tempo: '50 a 500 anos' },
      { material: 'Orgânico', tempo: '3 a 6 meses' },
    ],
    [],
  );

  const steps = useMemo(
    () => [
      {
        icon: '🔍',
        step: 'Identifique',
        description: 'Descubra se o material é reciclável, reutilizável ou orgânico.',
      },
      {
        icon: '✋',
        step: 'Separe',
        description: 'Coloque cada tipo de resíduo em recipientes diferentes.',
      },
      {
        icon: '📍',
        step: 'Descarte',
        description: 'Leve para pontos de coleta, estações de reciclagem e compostagem adequados.',
      },
    ],
    [],
  );

  const plantCards = useMemo(
    () => [
      {
        icon: '🌿',
        title: 'Verde no centro',
        text: 'Plantas representam o ciclo natural. Reciclar ajuda a manter esse ciclo saudável.',
      },
      {
        icon: '🌱',
        title: 'Compostagem',
        text: 'Resíduos orgânicos podem virar adubo e alimentar hortas e jardins.',
      },
      {
        icon: '🌳',
        title: 'Ciclo da natureza',
        text: 'Menos desperdício significa menos extração de recursos e mais espaço para plantas crescerem.',
      },
    ],
    [],
  );

  return (
    <div className="page">
      <nav>
        <div className="brand">ReUse</div>
        <div className="nav-links">
          <a href="#reciclagem">Reciclagem</a>
          <a href="#impacto">Impacto</a>
          <a href="#plantas">Plantas</a>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="hero-badge">Plataforma sustentável</span>
            <h1 className="hero-title">Um caminho natural para descartar melhor e cuidar das plantas da cidade</h1>
            <p className="hero-description">
              ReUse ajuda a entender onde descartar, o que é reciclagem e como cada gesto protege o solo, a água e o verde ao nosso redor.
            </p>
            <div className="hero-actions">
              <button className="button" onClick={() => alert('Reciclagem transforma material usado em novo produto.') }>
                O que é reciclagem?
              </button>
              <button className="button button-secondary" onClick={() => alert('Reciclar reduz lixo, preserva florestas e dá vida às plantas.') }>
                Qual impacto?
              </button>
            </div>
          </div>

          <div className="stats-grid">
            {stats.map(({ value, label }) => (
              <div className="stat-card" key={label}>
                <strong>{label}</strong>
                <div className="stat-value">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SectionHeader
        title="O que é reciclagem?"
        subtitle="Reciclagem é o processo de coletar, selecionar e transformar materiais usados em novos produtos, reduzindo o consumo de recursos naturais e o volume de lixo."
      />

      <div className="card-grid" id="reciclagem">
        {categories.map(({ icon, title, text }) => (
          <InfoCard key={title} icon={icon} title={title} text={text} />
        ))}
      </div>

      <section className="section" id="impacto">
        <h2 className="section-title">Importância e impacto</h2>
        <p className="section-intro">
          Reciclar é uma atitude com efeito direto na natureza: diminui a poluição, conserva recursos e ajuda a manter as áreas verdes saudáveis.
        </p>
        <div className="impact-grid">
          {impactItems.map(({ title, text }) => (
            <article className="impact-card" key={title}>
              <strong>{title}</strong>
              <p className="card-text">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="como-funciona">
        <h2 className="section-title">Como funciona</h2>
        <p className="section-intro">
          A ideia é permitir que qualquer pessoa, em qualquer lugar, saiba separar resíduos e entender o valor da reciclagem.
        </p>
        <div className="steps-grid">
          {steps.map(({ icon, step, description }) => (
            <StepCard key={step} icon={icon} step={step} description={description} />
          ))}
        </div>
      </section>

      <div className="highlight-box">
        <div>
          <strong>Plantas e reciclagem caminham juntas.</strong>
          <p>
            Quando reciclamos, reduzimos a demanda por novas matérias-primas e protegemos solo, ar e água, criando condições melhores para jardins e áreas verdes.
          </p>
        </div>
        <button className="button" onClick={() => alert('Reciclar protege a natureza e fortalece o ciclo das plantas.') }>
          Ver o impacto
        </button>
      </div>

      <section className="section">
        <h2 className="section-title">Tempo de decomposição</h2>
        <div className="timeline-card">
          <ul className="list">
            {decomposicao.map(({ material, tempo }) => (
              <li key={material}>
                <strong>{material}:</strong> {tempo}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="plantas">
        <h2 className="section-title">Plantas e sustentabilidade</h2>
        <p className="section-intro">
          Mais verde, menos desperdício. O ReUse mostra como separar resíduos ajuda diretamente a cidade e as áreas verdes próximas.
        </p>
        <div className="plant-grid">
          {plantCards.map(({ icon, title, text }) => (
            <article className="plant-card" key={title}>
              <div className="step-icon">{icon}</div>
              <strong>{title}</strong>
              <p className="card-text">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-box">
        <h3 className="card-title">Pronto para seguir</h3>
        <p className="card-text">
          Este site já traz a base de comunicação do ReUse: valores, processo, impacto e a conexão com o meio ambiente e as plantas.
        </p>
      </section>

      <footer className="footer">Sprint 1 — Tela inicial ReUse | React Web</footer>
    </div>
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
