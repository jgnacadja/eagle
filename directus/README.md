# directus/

Schema snapshots et configuration versionnés pour l'instance Directus
(back-office LEARN UP ACADEMY).

## Contenu attendu (à partir de ST-11)

- `schema/` — snapshot(s) exporté(s) via `directus schema snapshot`, au format
  YAML, un fichier par version stable.
- `extensions/` — extensions Directus custom versionnées, si nécessaire.

## Convention de restauration

Sur un environnement vierge (local ou recette) :

```bash
npx directus schema apply directus/schema/<snapshot>.yaml
```

La procédure exacte (rôles, permissions, données de seed) est documentée et
testée dans le cadre de ST-11.
