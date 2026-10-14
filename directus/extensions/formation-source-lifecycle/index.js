import { clearSourceArchiveOnEditorialStatusChange } from './lifecycle.js'

// Le filtre agit avant l'écriture, y compris sur les mises à jour en lot.
// La sync fournit toujours `archived_by_source` explicitement lors des
// changements automatiques de cycle de vie ; les changements de statut
// éditoriaux réinitialisent le marqueur pour ne pas être annulés plus tard.
export default ({ filter }) => {
  filter('formations.items.update', clearSourceArchiveOnEditorialStatusChange)
}
