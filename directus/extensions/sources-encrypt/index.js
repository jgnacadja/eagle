import process from 'node:process'
import { encryptPayload } from './crypto.js'

// Le chiffrement se fait avant l'écriture (filter, bloquant) : aucun secret
// en clair n'atteint la base ni l'historique d'activité.
export default ({ filter }) => {
  const encrypt = (payload) => encryptPayload(payload, process.env.SOURCES_ENC_KEY)
  filter('sources.items.create', encrypt)
  filter('sources.items.update', encrypt)
}
