import { createElement, useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { Text, View } from 'react-native';
import { tipografia } from '../../constants/tipografia';
import { ATRIBUICAO_MAPA, URL_TILES, type MapaDescarteProps } from './tipos';

let estilo: Promise<void> | null = null;
function carregarEstilo() {
  if (!estilo) estilo = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='; link.crossOrigin = '';
    link.onload = () => resolve();
    link.onerror = () => { link.remove(); estilo = null; reject(new Error('Estilo do mapa indisponível.')); };
    document.head.appendChild(link);
  });
  return estilo;
}

export default function MapaDescarte({ pontos, foco, onSelecionar }: MapaDescarteProps) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<Leaflet.Map | null>(null);
  const biblioteca = useRef<typeof Leaflet | null>(null);
  const marcadores = useRef(new Map<string, Leaflet.Marker>());
  const selecionar = useRef(onSelecionar);
  selecionar.current = onSelecionar;
  const [pronto, setPronto] = useState(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let resize: ResizeObserver | undefined;
    // Importação só no navegador: Leaflet depende do DOM.
    void Promise.all([import('leaflet'), carregarEstilo()]).then(([L]) => {
      if (cancelado || !elemento.current) return;
      biblioteca.current = L;
      const instancia = L.map(elemento.current, { scrollWheelZoom: false }).setView([-23.55, -46.64], 11);
      mapa.current = instancia;
      L.tileLayer(URL_TILES, { attribution: ATRIBUICAO_MAPA, maxZoom: 19 }).addTo(instancia)
        .on('tileerror', () => setErro(true)).on('tileload', () => setErro(false));
      resize = new ResizeObserver(() => instancia.invalidateSize());
      resize.observe(elemento.current);
      setPronto(true);
    }).catch(() => { if (!cancelado) setErro(true); });
    return () => { cancelado = true; resize?.disconnect(); mapa.current?.remove(); mapa.current = null; };
  }, []);

  useEffect(() => {
    const L = biblioteca.current;
    const instancia = mapa.current;
    if (!pronto || !L || !instancia) return;
    marcadores.current.forEach((marcador) => marcador.remove());
    marcadores.current.clear();
    const icone = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    });
    for (const ponto of pontos) {
      const popup = document.createElement('div');
      const titulo = document.createElement('strong');
      titulo.textContent = `Ecoponto ${ponto.nome}`;
      const endereco = document.createElement('p');
      endereco.textContent = ponto.endereco;
      popup.append(titulo, endereco);
      const marcador = L.marker([ponto.latitude, ponto.longitude], { icon: icone, title: `Ecoponto ${ponto.nome}`, alt: `Ecoponto ${ponto.nome}` })
        .addTo(instancia).bindPopup(popup).on('click', () => selecionar.current(ponto.id));
      marcadores.current.set(ponto.id, marcador);
    }
    if (pontos.length) instancia.fitBounds(L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude])), { padding: [32, 32], maxZoom: 14, animate: false });
  }, [pontos, pronto]);

  useEffect(() => {
    if (!foco || !pronto) return;
    const marcador = marcadores.current.get(foco.id);
    if (marcador) { mapa.current?.setView(marcador.getLatLng(), 15, { animate: false }); marcador.openPopup(); }
  }, [foco, pontos, pronto]);

  return <View>
    {erro ? <Text accessibilityRole="alert" style={tipografia.apoio}>O mapa pode estar sem conexão. Os endereços e o botão Como chegar continuam na lista.</Text> : null}
    {createElement('div', { ref: elemento, role: 'region', 'aria-label': 'Mapa dos ecopontos de São Paulo. Os mesmos endereços estão disponíveis na lista acima.', style: { height: 420, width: '100%', zIndex: 0, borderRadius: 12 } })}
  </View>;
}
