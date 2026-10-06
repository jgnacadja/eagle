/**
 * Correspondance code <-> nom des départements français
 * Données officielles INSEE / Etalab
 */

const CODE_TO_NAME: Record<string, string> = {
  '01': 'Ain',
  '02': 'Aisne',
  '03': 'Allier',
  '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes',
  '07': 'Ardèche',
  '08': 'Ardennes',
  '09': 'Ariège',
  '10': 'Aube',
  '11': 'Aude',
  '12': 'Aveyron',
  '13': 'Bouches-du-Rhône',
  '14': 'Calvados',
  '15': 'Cantal',
  '16': 'Charente',
  '17': 'Charente-Maritime',
  '18': 'Cher',
  '19': 'Corrèze',
  '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse',
  '21': "Côte-d'Or",
  '22': "Côtes-d'Armor",
  '23': 'Creuse',
  '24': 'Dordogne',
  '25': 'Doubs',
  '26': 'Drôme',
  '27': 'Eure',
  '28': 'Eure-et-Loir',
  '29': 'Finistère',
  '30': 'Gard',
  '31': 'Haute-Garonne',
  '32': 'Gers',
  '33': 'Gironde',
  '34': 'Hérault',
  '35': 'Ille-et-Vilaine',
  '36': 'Indre',
  '37': 'Indre-et-Loire',
  '38': 'Isère',
  '39': 'Jura',
  '40': 'Landes',
  '41': 'Loir-et-Cher',
  '42': 'Loire',
  '43': 'Haute-Loire',
  '44': 'Loire-Atlantique',
  '45': 'Loiret',
  '46': 'Lot',
  '47': 'Lot-et-Garonne',
  '48': 'Lozère',
  '49': 'Maine-et-Loire',
  '50': 'Manche',
  '51': 'Marne',
  '52': 'Haute-Marne',
  '53': 'Mayenne',
  '54': 'Meurthe-et-Moselle',
  '55': 'Meuse',
  '56': 'Morbihan',
  '57': 'Moselle',
  '58': 'Nièvre',
  '59': 'Nord',
  '60': 'Oise',
  '61': 'Orne',
  '62': 'Pas-de-Calais',
  '63': 'Puy-de-Dôme',
  '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées',
  '66': 'Pyrénées-Orientales',
  '67': 'Bas-Rhin',
  '68': 'Haut-Rhin',
  '69': 'Rhône',
  '70': 'Haute-Saône',
  '71': 'Saône-et-Loire',
  '72': 'Sarthe',
  '73': 'Savoie',
  '74': 'Haute-Savoie',
  '75': 'Paris',
  '76': 'Seine-Maritime',
  '77': 'Seine-et-Marne',
  '78': 'Yvelines',
  '79': 'Deux-Sèvres',
  '80': 'Somme',
  '81': 'Tarn',
  '82': 'Tarn-et-Garonne',
  '83': 'Var',
  '84': 'Vaucluse',
  '85': 'Vendée',
  '86': 'Vienne',
  '87': 'Haute-Vienne',
  '88': 'Vosges',
  '89': 'Yonne',
  '90': 'Territoire de Belfort',
  '91': 'Essonne',
  '92': 'Hauts-de-Seine',
  '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne',
  '95': "Val-d'Oise",
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'La Réunion',
  '975': 'Saint-Pierre-et-Miquelon',
  '976': 'Mayotte',
  '977': 'Saint-Barthélemy',
  '978': 'Saint-Martin',
  '984': 'Terres australes et antarctiques françaises',
  '986': 'Wallis et Futuna',
  '987': 'Polynésie française',
  '988': 'Nouvelle-Calédonie',
  '989': 'Île de Clipperton'
}

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const NAME_TO_CODE: Record<string, string> = {}
for (const [code, name] of Object.entries(CODE_TO_NAME)) {
  NAME_TO_CODE[normalize(name)] = code
}

/**
 * Résout le code et le libellé officiel d'un département à partir de l'un ou l'autre.
 */
export function resolveDepartment(value: string | null | undefined): {
  code: string
  name: string
} {
  if (!value) return { code: '', name: '' }
  const raw = value.trim()
  const upper = raw.toUpperCase()

  // Si c'est un code direct (ex: '75', '2A', '974')
  if (CODE_TO_NAME[upper]) {
    return { code: upper, name: CODE_TO_NAME[upper] }
  }

  // Si c'est un nom (ex: 'Val-de-Marne', 'Paris', 'val de marne')
  const codeFromName = NAME_TO_CODE[normalize(raw)]
  if (codeFromName && CODE_TO_NAME[codeFromName]) {
    return { code: codeFromName, name: CODE_TO_NAME[codeFromName] }
  }

  return { code: raw, name: raw }
}
