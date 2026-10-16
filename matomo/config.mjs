// Configuration déclarative de l'instance Matomo — source de vérité
// versionnée, équivalent de directus/schema/collections.mjs pour Directus.
// Appliquée par provision.mjs de façon idempotente via l'API HTTP Matomo.
//
// `idcustomdimension` est global et suit l'ordre de déclaration ci-dessous
// (1..6) — c'est cet id que le tracker JS adresse (`dimension{N}`), pas
// l'index par portée. Le front les consomme via
// apps/front/app/utils/matomo-dimensions.ts — toute modification ici doit
// être répercutée là-bas (et réciproquement).

export const SITE_ID = 1

export const site = {
  name: 'Learn Up',
  urls: ['http://localhost:3000', 'https://learnup.fr', 'https://www.learnup.fr'],
  timezone: 'Europe/Paris',
  ecommerce: 0
}

// portée action pour Gabarit/Famille/Département/Source catalogue,
// portée visite pour Landing SEO et Cluster (une valeur par visite).
export const dimensions = [
  { key: 'gabarit', name: 'Gabarit', scope: 'action' },
  { key: 'famille', name: 'Famille', scope: 'action' },
  { key: 'departement', name: 'Département', scope: 'action' },
  { key: 'source', name: 'Source catalogue', scope: 'action' },
  { key: 'landingSeo', name: 'Landing SEO', scope: 'visit' },
  { key: 'cluster', name: 'Cluster', scope: 'visit' }
]

// 7. Trois familles de déclencheurs :
// URL de confirmation : une page vue sur l'URL suffit, aucun
//   code front requis — le drapeau sessionStorage garantit le comptage.
// - Événement : correspondance sur l'action (`match_attribute`
//   `event_action` — la valeur confrontée au motif est l'action Matomo,
//   soit le nom du plan émis via useAnalytics().pushEvent).
// - session_signup : contrat d'événement réservé au tunnel d'inscription
//   Digiforma à venir — l'objectif est provisionné dès maintenant et
//   s'activera quand le tunnel émettra l'action.
export const goals = [
  {
    key: 'devis',
    name: 'Demande de devis',
    matchAttribute: 'url',
    pattern: '/confirmation/devis',
    patternType: 'contains'
  },
  {
    key: 'rendez-vous',
    name: 'Prise de rendez-vous',
    matchAttribute: 'url',
    pattern: '/confirmation/rendez-vous',
    patternType: 'contains'
  },
  {
    key: 'newsletter',
    name: 'Inscription newsletter',
    matchAttribute: 'url',
    pattern: '/confirmation/inscription',
    patternType: 'contains'
  },
  {
    key: 'pdf',
    name: 'Téléchargement programme PDF',
    matchAttribute: 'event_action',
    pattern: '^click_download_program$',
    patternType: 'regex'
  },
  {
    key: 'contact-centre',
    name: "Contact d'un centre",
    matchAttribute: 'event_action',
    pattern: '^click_cta_demande_formation_from_centre$',
    patternType: 'regex'
  },
  {
    key: 'tel',
    name: 'Clic téléphone',
    matchAttribute: 'event_action',
    pattern: '^click_phone$',
    patternType: 'regex'
  },
  {
    key: 'session',
    name: 'Inscription à une session',
    matchAttribute: 'event_action',
    pattern: '^session_signup$',
    patternType: 'regex'
  }
]

// Vie privée : exigence CNIL du tracker sans cookie (côté client,
// ici le pendant serveur). useAnonymizedIpForVisitEnrichment=0 évite
// d'enrichir la visite avec l'IP déjà tronquée (géoloc approximative).
export const privacy = {
  anonymizeIPEnable: 1,
  ipAddressMaskLength: 2,
  useAnonymizedIpForVisitEnrichment: 0,
  anonymizeUserId: 1,
  anonymizeReferrer: 1,
  anonymizeOrderId: 1,
  forceAnonymousVisitTracking: 0
}

// Durées de conservation : les données brutes de visite sont purgées
// au-delà de 13 mois — borne du référentiel d'exemption CNIL. Les rapports
// agrégés, déjà anonymes, sont conservés au-delà.
export const retention = {
  enableLogDelete: 1,
  deleteLogsOlderThan: 13 // mois
}
