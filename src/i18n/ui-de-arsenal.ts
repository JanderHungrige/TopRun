import type { UI_EN_ARSENAL } from './ui-en-arsenal';

// Deep arsenal (doc 43): uranium ammo and the weapon marks in the AUSRÜSTUNG; the mini-boss warning (doc 44).
export const UI_DE_ARSENAL: Readonly<Record<keyof typeof UI_EN_ARSENAL, string>> = {
  'arsenal.ammoName': 'Uranmunition',
  'arsenal.ammoDesc': 'Panzerbrechende Munition aus abgereichertem Uran für die Bordkanone, die zweite Kanone und die GAU-8. Jede Stufe bringt mehr Schaden, und die Geschosse durchschlagen Panzerung: Boden- und Seeziele nehmen mehr als halben Schaden.',
  'arsenal.ammoSub': 'Mehr Kanonenschaden · durchschlägt Panzerung',
  'arsenal.ammoRow': '+{damage} % Kanonenschaden · {ground} % gegen Bodenziele',
  'arsenal.ammoNext': 'Stufe 3 gibt es an der zweiten Front.',
  'arsenal.mark': 'Mk {n}',
  'arsenal.statMark': 'BAUSTUFE',
  'arsenal.upgradeMark': '{mark} · {price}',
  'arsenal.markTop': '{mark} EINGEBAUT',
  'arsenal.markLater': 'Mk III: 2. FRONT',
  'arsenal.markBought': '{item} auf {mark} verbessert',
  'arsenal.next': 'Nächste Stufe: {text}',
  'mission.miniBoss': '{name} voraus',
  'arsenal.markInfo': 'Mk II: +25 % Schaden, +1 pro Station. Mk III: +50 %, +2, schneller.',
};
