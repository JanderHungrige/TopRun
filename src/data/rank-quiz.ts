// Rank Quiz (doc 41): real ranks of four forces, each from lowest to highest. Names are proper names (the same in
// EN and DE); `grade` is the US pay grade (US forces only); `nato` the NATO rank code, null where the sources give
// none (those ranks only appear in order questions). Text only — no insignia (public site).

export type Force = 'usn' | 'usa' | 'marine' | 'heer';
export const FORCES: readonly Force[] = Object.freeze(['usn', 'usa', 'marine', 'heer'] as const);

export interface QuizRank {
  name: string;
  grade: string | null;
  nato: string | null;
}

const r = (name: string, nato: string | null, grade: string | null = null): QuizRank => ({ name, grade, nato });

const US_NAVY: readonly QuizRank[] = [
  r('Seaman Recruit', 'OR-1', 'E-1'),
  r('Seaman Apprentice', 'OR-2', 'E-2'),
  r('Seaman', 'OR-3', 'E-3'),
  r('Petty Officer Third Class', 'OR-4', 'E-4'),
  r('Petty Officer Second Class', 'OR-5', 'E-5'),
  r('Petty Officer First Class', 'OR-6', 'E-6'),
  r('Chief Petty Officer', 'OR-7', 'E-7'),
  r('Senior Chief Petty Officer', 'OR-8', 'E-8'),
  r('Master Chief Petty Officer', 'OR-9', 'E-9'),
  r('Ensign', 'OF-1', 'O-1'),
  r('Lieutenant Junior Grade', 'OF-1', 'O-2'),
  r('Lieutenant', 'OF-2', 'O-3'),
  r('Lieutenant Commander', 'OF-3', 'O-4'),
  r('Commander', 'OF-4', 'O-5'),
  r('Captain', 'OF-5', 'O-6'),
  r('Rear Admiral (lower half)', 'OF-6', 'O-7'),
  r('Rear Admiral', 'OF-7', 'O-8'),
  r('Vice Admiral', 'OF-8', 'O-9'),
  r('Admiral', 'OF-9', 'O-10'),
];

const US_ARMY: readonly QuizRank[] = [
  r('Private', 'OR-1', 'E-1'),
  r('Private First Class', 'OR-3', 'E-3'),
  r('Specialist', 'OR-4', 'E-4'),
  r('Sergeant', 'OR-5', 'E-5'),
  r('Staff Sergeant', 'OR-6', 'E-6'),
  r('Sergeant First Class', 'OR-7', 'E-7'),
  r('Master Sergeant', 'OR-8', 'E-8'),
  r('Sergeant Major', 'OR-9', 'E-9'),
  r('Second Lieutenant', 'OF-1', 'O-1'),
  r('First Lieutenant', 'OF-1', 'O-2'),
  r('Captain', 'OF-2', 'O-3'),
  r('Major', 'OF-3', 'O-4'),
  r('Lieutenant Colonel', 'OF-4', 'O-5'),
  r('Colonel', 'OF-5', 'O-6'),
  r('Brigadier General', 'OF-6', 'O-7'),
  r('Major General', 'OF-7', 'O-8'),
  r('Lieutenant General', 'OF-8', 'O-9'),
  r('General', 'OF-9', 'O-10'),
];

/** The enlisted ranks below the NCOs that both German services share after their first rank. */
const DE_ENLISTED: readonly QuizRank[] = [
  r('Gefreiter', 'OR-2'),
  r('Obergefreiter', 'OR-3'),
  r('Hauptgefreiter', null),
  r('Stabsgefreiter', 'OR-4'),
  r('Oberstabsgefreiter', null),
  r('Korporal', null),
  r('Stabskorporal', null),
];

const MARINE: readonly QuizRank[] = [
  r('Matrose', 'OR-1'),
  ...DE_ENLISTED,
  r('Maat', 'OR-5'),
  r('Obermaat', 'OR-5'),
  r('Bootsmann', 'OR-6'),
  r('Oberbootsmann', 'OR-6'),
  r('Hauptbootsmann', 'OR-7'),
  r('Stabsbootsmann', 'OR-8'),
  r('Oberstabsbootsmann', 'OR-9'),
  r('Leutnant zur See', 'OF-1'),
  r('Oberleutnant zur See', 'OF-1'),
  r('Kapitänleutnant', 'OF-2'),
  r('Stabskapitänleutnant', 'OF-2'),
  r('Korvettenkapitän', 'OF-3'),
  r('Fregattenkapitän', 'OF-4'),
  r('Kapitän zur See', 'OF-5'),
  r('Flottillenadmiral', 'OF-6'),
  r('Konteradmiral', 'OF-7'),
  r('Vizeadmiral', 'OF-8'),
  r('Admiral', 'OF-9'),
];

const HEER: readonly QuizRank[] = [
  r('Soldat', 'OR-1'),
  ...DE_ENLISTED,
  r('Unteroffizier', 'OR-5'),
  r('Stabsunteroffizier', 'OR-5'),
  r('Feldwebel', 'OR-6'),
  r('Oberfeldwebel', 'OR-6'),
  r('Hauptfeldwebel', 'OR-7'),
  r('Stabsfeldwebel', 'OR-8'),
  r('Oberstabsfeldwebel', 'OR-9'),
  r('Leutnant', 'OF-1'),
  r('Oberleutnant', 'OF-1'),
  r('Hauptmann', 'OF-2'),
  r('Stabshauptmann', 'OF-2'),
  r('Major', 'OF-3'),
  r('Oberstleutnant', 'OF-4'),
  r('Oberst', 'OF-5'),
  r('Brigadegeneral', 'OF-6'),
  r('Generalmajor', 'OF-7'),
  r('Generalleutnant', 'OF-8'),
  r('General', 'OF-9'),
];

/** Every force's ranks, lowest first. */
export const QUIZ_RANKS: Readonly<Record<Force, readonly QuizRank[]>> = Object.freeze({
  usn: US_NAVY, usa: US_ARMY, marine: MARINE, heer: HEER,
});
