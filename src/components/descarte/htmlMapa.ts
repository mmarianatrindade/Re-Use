import type { Ecoponto } from '../../schemas/ecoponto';
import { ATRIBUICAO_MAPA, URL_TILES } from './tipos';

export function criarHtmlMapa(pontos: Ecoponto[]): string {
  // Dados externos nunca entram como HTML nem podem encerrar a tag script.
  const dados = JSON.stringify(pontos.map(({ id, nome, endereco, latitude, longitude }) => ({ id, nome, endereco, latitude, longitude })))
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <style>html,body,#map{height:100%;margin:0}#status{position:absolute;top:12px;left:52px;right:12px;z-index:1000;background:white;padding:8px;font:14px sans-serif}#status:empty{display:none}</style></head><body>
  <div id="map" role="region" aria-label="Mapa de ecopontos de São Paulo"></div><div id="status" role="status">Carregando mapa…</div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
  var pontos=${dados}; var marcadores=Object.create(null);
  try {
    var mapa=L.map('map',{scrollWheelZoom:false}).setView([-23.55,-46.64],11);
    L.tileLayer(${JSON.stringify(URL_TILES)},{maxZoom:19,attribution:${JSON.stringify(ATRIBUICAO_MAPA)}}).addTo(mapa)
      .on('tileerror',function(){document.getElementById('status').textContent='Sem conexão com o mapa. Consulte os endereços na lista.';})
      .on('tileload',function(){document.getElementById('status').textContent='';});
    pontos.forEach(function(p){
      var conteudo=document.createElement('div'); var nome=document.createElement('strong'); var endereco=document.createElement('p');
      nome.textContent='Ecoponto '+p.nome; endereco.textContent=p.endereco; conteudo.appendChild(nome); conteudo.appendChild(endereco);
      var marcador=L.marker([p.latitude,p.longitude],{title:'Ecoponto '+p.nome,alt:'Ecoponto '+p.nome}).addTo(mapa).bindPopup(conteudo);
      marcador.on('click',function(){window.ReactNativeWebView.postMessage(JSON.stringify({id:p.id}));}); marcadores[p.id]=marcador;
    });
    if(pontos.length)mapa.fitBounds(pontos.map(function(p){return [p.latitude,p.longitude];}),{padding:[25,25],maxZoom:14,animate:false});
    window.focarEcoponto=function(id){var m=marcadores[id];if(m){mapa.setView(m.getLatLng(),15,{animate:false});m.openPopup();}};
    window.ReactNativeWebView.postMessage(JSON.stringify({pronto:true}));
  } catch(e){document.getElementById('status').textContent='Mapa indisponível. Consulte os endereços na lista.';}
  </script></body></html>`;
}
