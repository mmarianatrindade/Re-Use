import { Platform } from 'react-native';
import { colors } from '../constants/colors';

// No navegador, garante um contorno visível ao navegar pelo teclado (Tab) em botões, cards e campos.
// :focus-visible não aparece no clique com mouse ou toque, só na navegação por teclado.
export function installWebFocusStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  const id = 'reuse-focus-styles';
  if (document.getElementById(id)) {
    return;
  }

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    [tabindex]:focus-visible,
    [role="button"]:focus-visible,
    a:focus-visible {
      outline: 2px solid ${colors.teal} !important;
      outline-offset: 3px !important;
    }
    /* Campos de texto: o foco já aparece na borda do próprio campo (TextField), sem o retângulo do navegador. */
    input,
    input:focus,
    input:focus-visible,
    textarea,
    textarea:focus,
    textarea:focus-visible {
      outline: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}
