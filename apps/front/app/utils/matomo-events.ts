import type { MatomoCommand } from '~/utils/matomo'

// Traduction du plan de tracking (`types/analytics.ts`) en commandes Matomo.
// Catégorie = famille d'événements du plan, action = nom d'événement inchangé
// (retrouvable tel quel dans les rapports), nom = identifiants métier
// concaténés, valeur = compteur numérique quand le plan en définit un.
// Tout nouvel événement du plan doit obtenir sa règle ici — un événement
// sans règle n'est jamais envoyé (pas d'événement implicite).

interface EventRule {
  category: string
  /** Clés du payload concaténées `:` pour former le nom Matomo. */
  nameKeys?: readonly string[]
  /** Clé numérique du payload utilisée comme valeur Matomo. */
  valueKey?: string
}

/** Recherches natives Matomo (`trackSiteSearch`) plutôt que simples events. */
const SITE_SEARCH_EVENTS: Record<string, string> = {
  search_formations: 'Formations',
  search_centres: 'Centres'
}

const EVENT_RULES: Record<string, EventRule> = {
  // Réseau & partenaires
  view_rejoindre_reseau_page: { category: 'Réseau' },
  select_network_profile: { category: 'Réseau', nameKeys: ['profile_type', 'cta_location'] },
  submit_network_interest: { category: 'Réseau', nameKeys: ['profile_type', 'form_id'] },
  // Formations
  view_formations_catalog: { category: 'Formations', valueKey: 'results_count' },
  filter_formations: {
    category: 'Formations',
    nameKeys: ['filter_type', 'filter_value', 'filter_action'],
    valueKey: 'results_count'
  },
  sort_formations: { category: 'Formations', nameKeys: ['sort_type'], valueKey: 'results_count' },
  select_formation_card: {
    category: 'Formations',
    nameKeys: ['formation_name', 'list_name'],
    valueKey: 'position'
  },
  select_formation_centre: {
    category: 'Formations',
    nameKeys: ['formation_name', 'center_name'],
    valueKey: 'position'
  },
  view_formation_detail: {
    category: 'Formations',
    nameKeys: ['formation_name', 'formation_family']
  },
  click_cta_confier_formation: {
    category: 'Formations',
    nameKeys: ['cta_label', 'cta_location']
  },
  click_download_program: {
    category: 'Formations',
    nameKeys: ['formation_name', 'formation_family']
  },
  // Déclenche l'objectif « Inscription à une session » (ST-32) — contrat
  // réservé au tunnel d'inscription Digiforma à venir.
  session_signup: { category: 'Formations', nameKeys: ['formation_id', 'session_id'] },
  // Module Chatbot du plan
  chatbot_open: { category: 'Chatbot', nameKeys: ['trigger_type'] },
  chatbot_message_sent: { category: 'Chatbot', valueKey: 'message_index' },
  chatbot_suggested_action_click: {
    category: 'Chatbot',
    nameKeys: ['action_type', 'action_label']
  },
  chatbot_handoff_to_advisor: {
    category: 'Chatbot',
    nameKeys: ['reason'],
    valueKey: 'messages_count'
  },
  chatbot_conversation_end: { category: 'Chatbot', valueKey: 'duration_seconds' },
  // Moteur IA
  ai_search_start: { category: 'Assistant IA', nameKeys: ['source'] },
  ai_search_submit: { category: 'Assistant IA', nameKeys: ['source', 'via'], valueKey: 'turn' },
  ai_clarification_requested: {
    category: 'Assistant IA',
    nameKeys: ['source'],
    valueKey: 'turn'
  },
  ai_clarification_answer: {
    category: 'Assistant IA',
    nameKeys: ['source', 'via'],
    valueKey: 'turn'
  },
  ai_recommendation_display: {
    category: 'Assistant IA',
    nameKeys: ['source', 'mode'],
    valueKey: 'count'
  },
  ai_recommendation_select: {
    category: 'Assistant IA',
    nameKeys: ['slug', 'rank', 'action']
  },
  ai_recommendation_compare: { category: 'Assistant IA', nameKeys: ['source'], valueKey: 'count' },
  ai_no_results: { category: 'Assistant IA', nameKeys: ['kind', 'source'], valueKey: 'turn' },
  ai_unavailable: { category: 'Assistant IA', nameKeys: ['source'], valueKey: 'turn' },
  ai_fallback_mode: { category: 'Assistant IA', nameKeys: ['kind', 'source'], valueKey: 'turn' },
  ai_advisor_escalation: { category: 'Assistant IA', nameKeys: ['from', 'source'] },
  // Centres
  view_centres_list: { category: 'Centres' },
  filter_centres_department: {
    category: 'Centres',
    nameKeys: ['department_code', 'department_name'],
    valueKey: 'results_count'
  },
  select_centre_card: { category: 'Centres', nameKeys: ['center_name'], valueKey: 'position' },
  view_centre_detail: { category: 'Centres', nameKeys: ['center_name', 'center_department'] },
  toggle_map_view: { category: 'Centres', nameKeys: ['view_type'] },
  click_cta_demande_formation_from_centre: {
    category: 'Centres',
    nameKeys: ['center_id', 'cta_location']
  },
  click_phone: { category: 'Centres', nameKeys: ['center_name', 'phone_type'] },
  click_download_qualiopi: { category: 'Centres', nameKeys: ['center_name'] },
  // Actualités
  view_blog_list: { category: 'Actualités', valueKey: 'articles_count' },
  filter_blog_category: {
    category: 'Actualités',
    nameKeys: ['category_name'],
    valueKey: 'results_count'
  },
  select_article_card: {
    category: 'Actualités',
    nameKeys: ['article_title', 'list_name'],
    valueKey: 'position'
  },
  view_article_detail: {
    category: 'Actualités',
    nameKeys: ['article_title', 'article_category']
  },
  share_article: { category: 'Actualités', nameKeys: ['share_channel', 'article_id'] },
  // Formulaires
  form_view: { category: 'Formulaires', nameKeys: ['form_id', 'form_step_name'] },
  form_start: { category: 'Formulaires', nameKeys: ['form_id', 'field_name'] },
  form_error: { category: 'Formulaires', nameKeys: ['form_id', 'field_name', 'error_type'] },
  form_abandon: {
    category: 'Formulaires',
    nameKeys: ['form_id'],
    valueKey: 'fields_completed_count'
  },
  form_submit: {
    category: 'Formulaires',
    nameKeys: ['form_id', 'form_type'],
    valueKey: 'completion_time_seconds'
  }
}

/**
 * Liste noire des clés contenant potentiellement des données personnelles (PII).
 * Aucune PII ne doit transiter dans Matomo (convention RGPD).
 */
const PII_FORBIDDEN_KEYS = new Set([
  'email',
  'mail',
  'telephone',
  'phone',
  'tel',
  'nom',
  'prenom',
  'name_personal',
  'first_name',
  'last_name',
  'firstname',
  'lastname',
  'password',
  'token',
  'bearer',
  'siret',
  'address_personal'
])

/**
 * Nettoie récursivement un objet pour :
 * 1. Supprimer les clés ayant une valeur `undefined`, `null` ou chaîne vide `""`.
 * 2. Éliminer toute clé contenant des données personnelles (PII).
 */
export function cleanEventPayload<T extends Record<string, unknown>>(
  payload: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(payload)) {
    // Exclusion stricte PII
    if (PII_FORBIDDEN_KEYS.has(key.toLowerCase())) {
      continue
    }

    // Exclusion des valeurs vides ou indéfinies
    if (value === undefined || value === null || value === '') {
      continue
    }

    // Récursion si objet imbriqué (hors tableau ou primitives)
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanEventPayload(value as Record<string, unknown>)
      if (Object.keys(cleanedNested).length > 0) {
        result[key] = cleanedNested
      }
      continue
    }

    result[key] = value
  }

  return result
}

/**
 * Convertit un événement du plan de tracking en commandes `_paq`.
 * `page_view` est ignoré : les vues sont déjà couvertes par `trackPageView`
 * (plugin matomo.client).
 */
export function toMatomoCommands(payload: Record<string, unknown>): MatomoCommand[] {
  const event = typeof payload.event === 'string' ? payload.event : ''
  if (!event || event === 'page_view') return []

  const searchCategory = SITE_SEARCH_EVENTS[event]
  if (searchCategory) {
    const term = payload.search_term
    if (typeof term !== 'string' || !term) return []
    const count = typeof payload.results_count === 'number' ? payload.results_count : 0
    return [['trackSiteSearch', term, searchCategory, count]]
  }

  const rule = EVENT_RULES[event]
  if (!rule) return []

  const command: MatomoCommand = ['trackEvent', rule.category, event]
  const name = (rule.nameKeys ?? [])
    .map((key) => payload[key])
    .filter((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
    .map(String)
    .join(':')
  const value = rule.valueKey ? payload[rule.valueKey] : undefined

  // Matomo positionne la valeur après le nom : un nom vide est requis quand
  // seule la valeur est définie.
  if (name) command.push(name)
  if (typeof value === 'number') {
    if (!name) command.push('')
    command.push(value)
  }

  return [command]
}
