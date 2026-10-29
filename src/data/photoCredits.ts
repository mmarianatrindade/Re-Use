// Fotos obtidas no Wikimedia Commons. Licenças CC BY / CC BY-SA exigem atribuição.
export interface CreditoFoto {
  subject: string;
  author: string;
  license: string;
  source: string;
}

export const photoCredits: CreditoFoto[] = [
  { subject: 'Loja beneficente', author: 'Opaquetights99', license: 'CC BY-SA 4.0', source: 'https://commons.wikimedia.org/wiki/File:Working_in_charity_shop.jpg' },
];
