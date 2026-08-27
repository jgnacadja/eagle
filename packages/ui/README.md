# @learnup/ui

Design system token-driven pour LEARN UP ACADEMY.

## État actuel — tokens provisoires

Les valeurs dans `src/tokens/` et `src/tokens.css` sont des **placeholders neutres**.
Aucune direction artistique n'est validée à ce stade (Lot 1 / ST-06 — maquettes des
4 gabarits). Elles servent uniquement à garantir qu'aucune valeur de style n'est
écrite en dur dans `apps/front` pendant ce sprint.

Dès que la DA est validée par LEARN UP PRIME, ST-13 remplace les valeurs dans ce
package — aucun changement attendu côté consommateurs (`apps/front` continue de
lire les mêmes noms de tokens).

## Usage

```ts
import { colors, spacing } from '@learnup/ui'
```

```css
@import '@learnup/ui/tokens.css';
```

## Convention

Toute nouvelle valeur de style (couleur, espacement, rayon, ombre, typographie)
doit être ajoutée ici — jamais écrite en dur dans un composant ou une config
Tailwind consommatrice.
