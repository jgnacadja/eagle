export interface CompanyLogo {
  name: string
  logoUrl: string
}

// Logos servis depuis public/logos — assets locaux, pas d'allers-retours
// vers Wikimedia à chaque chargement.
export const companyLogos: CompanyLogo[] = [
  {
    name: 'Capgemini',
    logoUrl: '/logos/capgemini.svg'
  },
  {
    name: 'Microsoft',
    logoUrl: '/logos/microsoft.svg'
  },
  {
    name: 'Google Cloud',
    logoUrl: '/logos/google-cloud.svg'
  },
  {
    name: 'Amazon',
    logoUrl: '/logos/amazon.svg'
  },
  {
    name: 'IBM',
    logoUrl: '/logos/ibm.svg'
  },
  {
    name: 'Oracle',
    logoUrl: '/logos/oracle.svg'
  }
]

/** Logos spécifiques à la page d'accueil (inclut Salesforce et SAP). */
export const homeLogos: CompanyLogo[] = [
  ...companyLogos,
  {
    name: 'Salesforce',
    logoUrl: '/logos/salesforce.svg'
  },
  {
    name: 'SAP',
    logoUrl: '/logos/sap.svg'
  }
]
