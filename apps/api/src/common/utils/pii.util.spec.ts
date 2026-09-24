import { PII_PLACEHOLDERS, scrubPersonalData } from './pii.util'

describe('scrubPersonalData', () => {
  it('keeps business content untouched', () => {
    const text = 'Former 8 salariés au CACES R489 près de Lyon avant septembre 2026'
    expect(scrubPersonalData(text)).toBe(text)
  })

  it('masks e-mail addresses, including accented local parts', () => {
    expect(scrubPersonalData('Contact : jean.dupont+rh@exemple-société.fr merci')).toBe(
      `Contact : ${PII_PLACEHOLDERS.email} merci`
    )
  })

  it('masks french phone numbers with or without separators', () => {
    expect(scrubPersonalData('rappelez-moi au 06 12 34 56 78 ou 0712345678')).toBe(
      `rappelez-moi au ${PII_PLACEHOLDERS.phone} ou ${PII_PLACEHOLDERS.phone}`
    )
    expect(scrubPersonalData('tel +33 6 12 34 56 78')).toBe(`tel ${PII_PLACEHOLDERS.phone}`)
  })

  it('masks SIRET numbers, grouped or not', () => {
    expect(scrubPersonalData('siret 123 456 789 00012')).toBe(`siret ${PII_PLACEHOLDERS.siret}`)
    expect(scrubPersonalData('siret 12345678900012')).toBe(`siret ${PII_PLACEHOLDERS.siret}`)
  })

  it('masks IBAN and long digit sequences', () => {
    expect(scrubPersonalData('IBAN FR76 3000 6000 0112 3456 7890 189')).toBe(
      `IBAN ${PII_PLACEHOLDERS.iban}`
    )
    expect(scrubPersonalData('numéro 1234567890123')).toBe(`numéro ${PII_PLACEHOLDERS.number}`)
  })

  it('leaves short numbers (dates, headcounts, budgets) alone', () => {
    const text = 'budget 15 000 € pour 12 personnes le 15 mars 2026 à 14h30'
    expect(scrubPersonalData(text)).toBe(text)
  })
})
