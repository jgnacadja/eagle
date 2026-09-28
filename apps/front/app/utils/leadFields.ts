import { z } from 'zod'

export interface LeadFieldMessages {
  /** Message affiché quand l'e-mail est vide. */
  email: string
  /** Message affiché tant que le consentement n'est pas coché. */
  consentement: string
}

/**
 * Champs de contact communs aux formulaires de lead (candidature,
 * conseiller, demande de formation). Les messages propres à chaque
 * formulaire sont passés en paramètre.
 */
export const leadFields = ({ email, consentement }: LeadFieldMessages) => ({
  nom: z
    .string({ error: 'Indiquez votre nom et prénom.' })
    .trim()
    .min(1, 'Indiquez votre nom et prénom.'),
  email: z.string({ error: email }).trim().min(1, email).pipe(z.email('Format d’e-mail invalide.')),
  telephone: z
    .string({ error: 'Indiquez votre téléphone.' })
    .trim()
    .min(1, 'Indiquez votre téléphone.')
    .refine(
      (value) => value.replace(/\D/g, '').length >= 10,
      'Numéro incomplet — 10 chiffres attendus.'
    ),
  consentement: z.boolean({ error: consentement }).refine((value) => value, consentement)
})
