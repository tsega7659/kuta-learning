# Kuta Learning Admin

This is the standalone content-manager application. The student application remains in
`Frontend/front-ui`.

The admin portal opens to National Exams and also includes Short Notes. Short Notes
organizes notes by program grade, stream, curriculum grade, subject, and chapter; each
chapter can contain multiple text notes and PDF uploads.

After deploying the short-note schema change, apply the backend migration from
`Backend` with `npm run db:migrate`.

## Run locally

```sh
npm install
npm run dev
```

The admin app runs on `http://localhost:5174`; the student app uses Vite's default
`http://localhost:5173`.

Set `VITE_API_BASE_URL` when the backend is not at the default API URL. Set the same
admin origin in the backend's `CORS_ORIGINS` environment variable when deploying the
admin app to a different domain. The student app's login redirects content-manager
accounts to the URL in its `VITE_ADMIN_APP_URL` setting.

## Build and lint

```sh
npm run build
npm run lint
```
