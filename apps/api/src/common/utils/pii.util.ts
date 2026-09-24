/**
 * Masquage des données personnelles évidentes dans un texte saisi par un
 * visiteur, avant journalisation (RGPD — minimisation). Seuls les motifs
 * identifiants sont remplacés ; le contenu métier (« former 8 salariés au
 * CACES près de Lyon ») est conservé tel quel : c'est lui qui a de la valeur
 * pour la revue produit.
 */
const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu

// IBAN : code pays + 2 chiffres de contrôle + groupes de 4, espaces facultatifs.
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,4})?\b/g

// Téléphone français : 0X ou +33 X, puis 4 paires de chiffres (séparateurs facultatifs).
const FR_PHONE_PATTERN = /(?:\+33\s?[1-9]|0[1-9])(?:[\s.-]?\d{2}){4}\b/g

// SIRET saisi groupé (3-3-3-5, espaces facultatifs).
const SIRET_PATTERN = /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/g

// Toute suite d'au moins 10 chiffres collés : téléphone brut, SIRET,
// numéro de sécurité sociale — aucun nombre métier n'atteint cette taille.
const LONG_DIGITS_PATTERN = /\b\d{10,}\b/g

export const PII_PLACEHOLDERS = {
  email: '[email]',
  iban: '[iban]',
  phone: '[téléphone]',
  siret: '[siret]',
  number: '[numéro]'
} as const

export function scrubPersonalData(text: string): string {
  return text
    .replace(EMAIL_PATTERN, PII_PLACEHOLDERS.email)
    .replace(IBAN_PATTERN, PII_PLACEHOLDERS.iban)
    .replace(FR_PHONE_PATTERN, PII_PLACEHOLDERS.phone)
    .replace(SIRET_PATTERN, PII_PLACEHOLDERS.siret)
    .replace(LONG_DIGITS_PATTERN, PII_PLACEHOLDERS.number)
}
