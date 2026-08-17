const { useMemo, useState } = React;

const stats = [
  { value: '1,2M', label: 'toneladas de resíduos por ano', accent: '#217A5B' },
  { value: '73%', label: 'dos materiais podem ser reutilizados', accent: '#3C9C7A' },
  { value: '3x', label: 'mais impacto com separação correta', accent: '#76B98B' },
];

const materials = [
  {
    id: 'papel',
    name: 'Papel',
    time: '2 a 6 meses',
    category: 'Reciclável',
    description: 'Papel, caixa de leite, embalagens achatadas e jornais devem ser secos e separados da sujeira.',
    disposal: 'Leve ao reciclável ou ao ecoponto mais próximo.',
    color: '#4AAE78',
  },
  {
    id: 'plastico',
    name: 'Plástico',
    time: '200 a 450 anos',
    category: 'Reciclável',
    description: 'Garrafas, potes, tampas e embalagens precisam ser lavados e retirados de resíduos orgânicos.',
    disposal: 'Coloque em recipiente próprio para plástico ou em coleta seletiva.',
    color: '#2E8B6A',
  },
  {
    id: 'metal',
    name: 'Metal',
    time: '50 a 500 anos',
    category: 'Reciclável',
    description: 'Latas, alumínio e ferro podem ser reutilizados em larga escala e têm grande valor de reciclagem.',
    disposal: 'Separe por tipo e entregue em pontos de coleta de metal.',
    color: '#7CCB8C',
  },
  {
    id: 'vidro',
    name: 'Vidro',
    time: 'mais de 1 milhão de anos',
    category: 'Reciclável',
    description: 'Garrafas e potes de vidro devem ser limpos e separados, sem mistura com outros resíduos.',
    disposal: 'Mantenha em saco ou caixa e entregue ao ponto de coleta de vidro.',
    color: '#4AC0D4',
  },
  {
    id: 'organico',
    name: 'Orgânico',
    time: '3 a 6 meses',
    category: 'Compostagem',
    description: 'Restos de alimentos e folhas secas podem virar adubo orgânico com compostagem.',
    disposal: 'Separe em um recipiente específico para compostagem ou coleta orgânica.',
    color: '#6CCB62',
  },
  {
    id: 'eletronico',
    name: 'E-lixo',
    time: 'varia conforme o componente',
    category: 'Especial',
    description: 'Pilhas, baterias e pequenos eletrônicos precisam de tratamento diferenciado para evitar contaminação.',
    disposal: 'Entregue em pontos de coleta de resíduos eletrônicos e baterias.',
    color: '#FFB65C',
  },
];

const decomposition = [
  { name: 'Papel', time: '2 a 6 meses' },
  { name: 'Orgânico', time: '3 a 6 meses' },
  { name: 'Metal', time: '50 a 500 anos' },
  { name: 'Plástico', time: '200 a 450 anos' },
  { name: 'Vidro', time: 'mais de 1 milhão de anos' },
];

const faqItems = [
  {
    question: 'Como saber se um material é reciclável?',
    answer: 'A regra mais segura é limpar o item, verificar se ele é seco e separar pelas categorias de papel, vidro, metal, plástico e orgânico.',
  },
  {
    question: 'Posso misturar materiais no mesmo saco?',
    answer: 'Não. Misturar materiais pode contaminar toda a carga e atrapalhar a reciclagem. Separe antes de levar ao ecoponto.',
  },
  {
    question: 'O que fazer com pilhas, baterias e eletrônicos?',
    answer: 'Esses itens precisam de tratamento especial e devem ser levados a pontos específicos de coleta de e-lixo e baterias.',
  },
];

const steps = [
  { icon: '1', title: 'Observe', text: 'Analise o material e escolha a categoria correta.' },
  { icon: '2', title: 'Separe', text: 'Mantenha os itens limpos e organizados em casa ou no trabalho.' },
  { icon: '3', title: 'Doe ou recicle', text: 'Leve ao ponto adequado e reduza o impacto ambiental.' },
];

const cityOptions = ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Belo Horizonte'];

function SectionHeader({ title, subtitle }) {
  return (
    <section className="section">
      <h2 className="section-title">{title}</h2>
      <p className="section-intro">{subtitle}</p>
    </section>
  );
}

function App() {
  const [selectedMaterial, setSelectedMaterial] = useState(materials[0]);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [selectedCity, setSelectedCity] = useState('São Paulo');

  const selectedMaterialIndex = useMemo(
    () => materials.findIndex((material) => material.id === selectedMaterial.id),
    [selectedMaterial],
  );

  const mapQuery = `ecopontos públicos ${selectedCity}`;

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent(mapQuery);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="page-shell">
      <nav className="topbar">
        <div className="brand-wrap">
          <div className="brand">ReUse</div>
          <span className="brand-tag">Eco+</span>
        </div>
        <div className="nav-links">
          <a href="#inicio">Início</a>
          <a href="#materiais">Materiais</a>
          <a href="#mapa">Mapa</a>
        </div>
      </nav>

      <header className="hero" id="inicio">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">Sustentabilidade urbana</span>
            <h1>Seu lixo, sua escolha, o planeta agradece.</h1>
            <p>
              A ReUse mostra como separar corretamente os resíduos, entender os tempos de decomposição
              e localizar ecopontos públicos com facilidade na rotina de qualquer cidade.
            </p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => setExpandedFaq(0)}>Ver dica</button>
              <button className="button secondary" onClick={handleOpenGoogleMaps}>Saiba mais</button>
            </div>
          </div>

          <div className="planet-wrap">
            <img
              src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"
              alt="Planeta e natureza"
              className="planet-image"
            />
          </div>
        </div>
      </header>

      <div className="trust-bar">
        <span>Mais de 12 mil pessoas já praticam descarte consciente</span>
        <button className="mini-button" onClick={() => setExpandedFaq(0)}>Começar agora</button>
      </div>

      <div className="highlight-row">
        <div className="mini-card">
          <strong>+ 70%</strong>
          <span>de materiais reaproveitáveis</span>
        </div>
        <div className="mini-card">
          <strong>19k</strong>
          <span>pontos de coleta ativos</span>
        </div>
        <div className="mini-card">
          <strong>4 passos</strong>
          <span>para reciclar melhor</span>
        </div>
      </div>

      <div className="cta-banner">
        <span className="cta-badge">Ação diária</span>
        <h3>Pequenos hábitos transformam a cidade.</h3>
        <p>Separar corretamente, reduzir resíduos e orientar a comunidade é o primeiro passo para um futuro mais limpo.</p>
      </div>

      <SectionHeader
        title="Números que importam"
        subtitle="Pequenas mudanças de rotina fazem uma diferença enorme na saúde do planeta."
      />

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value" style={{ color: stat.accent }}>{stat.value}</div>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      <SectionHeader
        title="Materiais e descarte"
        subtitle="Clique em cada material para entender como fazer a separação correta e quanto tempo ele leva para se decompor."
      />

      <div className="material-selector" id="materiais">
        {materials.map((material) => {
          const isSelected = selectedMaterial.id === material.id;
          return (
            <button
              key={material.id}
              className={`material-chip ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedMaterial(material)}
            >
              {material.name}
            </button>
          );
        })}
      </div>

      <div className="material-detail">
        <div className="material-header">
          <h3>{selectedMaterial.name}</h3>
          <span className="material-badge" style={{ background: selectedMaterial.color }}>
            {selectedMaterial.category}
          </span>
        </div>

        <div className="progress-wrap">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${((selectedMaterialIndex + 1) / materials.length) * 100}%`,
                background: selectedMaterial.color,
              }}
            />
          </div>
          <span>Nível de cuidado: {selectedMaterialIndex + 1}/{materials.length}</span>
        </div>

        <div className="material-time">Tempo estimado: {selectedMaterial.time}</div>
        <p className="material-description">{selectedMaterial.description}</p>
        <p className="material-disposal">{selectedMaterial.disposal}</p>

        <div className="material-steps">
          <strong>Como funciona o descarte:</strong>
          <p>1. Seque ou lave o material antes de separar.</p>
          <p>2. Coloque na categoria correta.</p>
          <p>3. Leve ao ponto de coleta mais próximo.</p>
        </div>
      </div>

      <div className="benefits-grid">
        <div className="benefit-card">
          <span className="benefit-icon">🌱</span>
          <strong>Menos lixo</strong>
          <p>A separação correta reduz o volume de resíduos que vai para aterros.</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">♻️</span>
          <strong>Mais reciclagem</strong>
          <p>Materiais limpos e organizados têm muito mais chance de serem reutilizados.</p>
        </div>
        <div className="benefit-card">
          <span className="benefit-icon">🌍</span>
          <strong>Planeta mais saudável</strong>
          <p>Ajudamos a reduzir a poluição, o desperdício e o impacto ambiental urbano.</p>
        </div>
      </div>

      <div className="quick-actions">
        <button className="quick-action">✅ Separar</button>
        <button className="quick-action">🧺 Coletar</button>
        <button className="quick-action">📍 Locais</button>
      </div>

      <SectionHeader
        title="Como funciona"
        subtitle="Um caminho simples para transformar resíduos em ação consciente e útil para a cidade."
      />

      <div className="steps-grid">
        {steps.map((step) => (
          <div key={step.title} className="step-card">
            <div className="step-icon">{step.icon}</div>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </div>
        ))}
      </div>

      <SectionHeader
        title="Linha do tempo"
        subtitle="Quanto mais tempo o material leva para se decompor, maior o cuidado necessário com o descarte."
      />

      <div className="timeline-box">
        <div className="timeline-rail" />
        {decomposition.map((item, index) => (
          <div
            key={item.name}
            className="timeline-item"
            style={{ left: `${(index / (decomposition.length - 1)) * 100}%` }}
          >
            <div className="timeline-bubble">
              <span>{item.name}</span>
              <small>{item.time}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="highlight-box">
        <div className="highlight-content">
          <span className="highlight-tag">Impacto real</span>
          <h4>A escolha certa reduz poluição e economiza recursos naturais.</h4>
          <p>
            Quando o consumidor separa corretamente os materiais, o sistema de reciclagem funciona melhor,
            reduzindo enchentes, desperdício e emissão de gases nocivos.
          </p>
        </div>
      </div>

      <SectionHeader
        title="Perguntas frequentes"
        subtitle="Dúvidas simples para você fazer a separação correta todos os dias."
      />

      <div className="faq-container">
        {faqItems.map((item, index) => {
          const isOpen = expandedFaq === index;
          return (
            <div key={item.question} className={`faq-item ${isOpen ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setExpandedFaq(isOpen ? -1 : index)}>
                <span>{item.question}</span>
                <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="faq-answer">{item.answer}</div>}
            </div>
          );
        })}
      </div>

      <SectionHeader
        title="Ecopontos públicos"
        subtitle="Veja os pontos de coleta públicos mais próximos e ajude a deixar a cidade mais limpa."
      />

      <div className="map-card" id="mapa">
        <div className="map-header-bar">
          <div>
            <span className="map-kicker">Busca por cidade</span>
            <h3>Mapa de ecopontos públicos</h3>
          </div>
          <span className="map-pill">Coleta seletiva</span>
        </div>

        <div className="map-selector">
          {cityOptions.map((city) => (
            <button
              key={city}
              className={`city-option ${selectedCity === city ? 'active' : ''}`}
              onClick={() => setSelectedCity(city)}
            >
              {city}
            </button>
          ))}
        </div>

        <div className="map-frame-wrap">
          <iframe
            className="map-frame"
            title={`Mapa de ecopontos públicos em ${selectedCity}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=12&output=embed`}
            loading="lazy"
            allowFullScreen
          />
        </div>

        <div className="map-content">
          <p>
            Consulte os ecopontos mais próximos de <strong>{selectedCity}</strong> e veja onde separar corretamente seus resíduos antes do descarte.
          </p>
          <div className="map-actions">
            <button className="button primary map-button" onClick={handleOpenGoogleMaps}>Abrir no Google Maps</button>
            <button className="button secondary" onClick={handleOpenGoogleMaps}>Ver pontos prontos</button>
          </div>
        </div>
      </div>

      <div className="action-box">
        <h3>Pronto para agir?</h3>
        <p>
          Comece separando os resíduos da sua casa, use pontos de coleta e incentive outros a fazerem o mesmo.
        </p>
        <button className="button primary" onClick={handleOpenGoogleMaps}>Quero aprender mais</button>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
