export interface CompanyLogo {
  name: string
  logoUrl: string
}

export const companyLogos: CompanyLogo[] = [
  {
    name: 'Capgemini',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Capgemini_201x_logo.svg'
  },
  {
    name: 'Microsoft',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg'
  },
  {
    name: 'Google Cloud',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg'
  },
  {
    name: 'Amazon',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  {
    name: 'IBM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg'
  },
  {
    name: 'Oracle',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg'
  }
]

/** Logos spécifiques à la page d'accueil (inclut Salesforce et SAP). */
export const homeLogos: CompanyLogo[] = [
  ...companyLogos,
  {
    name: 'Salesforce',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg'
  },
  {
    name: 'SAP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg'
  }
]
