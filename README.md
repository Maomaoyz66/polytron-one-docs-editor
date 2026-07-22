# POLYTRON ONE Documentation

Bilingual POLYTRON ONE product documentation with a browser-based editor and Vercel serverless publishing API.

## Local development

```bash
npm install
npm run dev
```

- Documentation: `http://127.0.0.1:4173/zh/docs`
- English documentation: `http://127.0.0.1:4173/en/docs`
- Editor: `http://127.0.0.1:4173/editor`

## Production build

```bash
npm run build
```

The Vite application is written to `dist/`. Vercel also deploys the functions in `api/` for editor login, publishing, media upload, and status checks.

## Vercel environment variables

Configure the following server-side variables before enabling the online editor:

- `EDITOR_PASSWORD`
- `EDITOR_SESSION_SECRET`
- `GITHUB_TOKEN`
- `GITHUB_REPO=Maomaoyz66/polytron-one-docs-editor`
- `GITHUB_BRANCH=main`
- `PRODUCTION_DOCS_URL=https://polytron-one-docs.vercel.app/docs`

Do not prefix secrets with `VITE_`. See `.env.example` for the complete configuration template.

## Large media

MP4 assets are tracked with Git LFS. Install Git LFS before cloning or contributing:

```bash
git lfs install
```
