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
  // Les max() calquent les bornes @MaxLength du DTO API (LeadContactDto) :
  // une valeur refusée côté serveur est bloquée ici avec un message de champ.
  nom: z
    .string({ error: 'Indiquez votre nom et prénom.' })
    .trim()
    .min(1, 'Indiquez votre nom et prénom.')
    .max(200, 'Nom trop long — 200 caractères maximum.'),
  email: z
    .string({ error: email })
    .trim()
    .min(1, email)
    .max(320, 'E-mail trop long — 320 caractères maximum.')
    .pipe(z.email('Format d’e-mail invalide.')),
  telephone: z
    .string({ error: 'Indiquez votre téléphone.' })
    .trim()
    .min(1, 'Indiquez votre téléphone.')
    .max(30, 'Numéro de téléphone trop long — 30 caractères maximum.')
    .refine(
      (value) => value.replace(/\D/g, '').length >= 10,
      'Numéro incomplet — 10 chiffres attendus.'
    ),
  consentement: z.boolean({ error: consentement }).refine((value) => value, consentement)
})
