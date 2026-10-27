// Ladder flags (doc 28): the real flag of every country, pixelated to 24 × 18 from the MIT flag-icons set and
// packed into one sheet, src/assets/flags/flags.png — FLAG_COLS per row, in FLAG_ORDER. Pure.

export const FLAG_W = 24;
export const FLAG_H = 18;
export const FLAG_COLS = 16;

/** The country codes in the sheet, row by row. */
export const FLAG_ORDER: readonly string[] = [
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS',
  'BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG',
  'EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HN HR',
  'HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK',
  'LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE',
  'NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB',
  'SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT',
  'TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW',
].join(' ').split(' ');

const INDEX: ReadonlyMap<string, number> = new Map(FLAG_ORDER.map((code, i) => [code, i]));

/** Top-left of a country's flag in the sheet, or null when the sheet has none. */
export function flagCell(code: string): { x: number; y: number } | null {
  const i = INDEX.get(code);
  return i === undefined ? null : { x: (i % FLAG_COLS) * FLAG_W, y: Math.floor(i / FLAG_COLS) * FLAG_H };
}
