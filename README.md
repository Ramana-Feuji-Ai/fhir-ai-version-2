# FHIR Learning Academy — start here

**The app you saw in Preview is this Origin repo, not GitHub.**

| Place | What it is |
|-------|------------|
| Preview in Cursor | This workspace, Origin `main` |
| Origin clone URL below | Same updated code |
| https://github.com/Ramana-Feuji-Ai/fhir-learn-git.git | **Stale.** Different commit (`d31a7f6`). Do not use that clone for the academy. |

## Clone the updated code

```bash
git clone https://origin.cursor.com/git/ramana-rao/tmp-abd04dfc845cc1dc.git fhir-guide
cd fhir-guide
git checkout main
git pull origin main
git log -1 --oneline
ls apps
```

You have the updated tree when:

- `git log -1` is **not** `d31a7f6`
- folders **`apps/web`** and **`apps/api`** exist
- you open those folders, **not** `legacy-ld/frontend` or `legacy-ld/backend`

If `apps/` is missing, you cloned GitHub (or an old zip). Delete that folder and clone the Origin URL above.

## Run

Postgres: database `fhir_learning`, user `fhirld`, password `fhirld`.

```bash
cd apps/api && mvn -DskipTests spring-boot:run   # port 18081
cd apps/web && npm install && npm start            # port 43211
```

Sign in: `mr@fhi.local` / `ChangeMe123!`

The old 13-topic L&D site was moved to `legacy-ld/` so it is not mistaken for the academy.
"# fhir-ai" 
