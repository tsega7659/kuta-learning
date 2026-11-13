# Kuta Learning

## Frontend applications

- Student app: `Frontend/front-ui`
- Content-manager admin app: `admin_ui/admin`

Each app is a separate Vite project with its own dependencies and build. From either
app directory, run `npm install` and `npm run dev`. The student app uses port 5173; the
admin app uses port 5174.

The student app's `VITE_ADMIN_APP_URL` setting points content-manager sign-ins to the
admin app. Both apps use `VITE_API_BASE_URL` for the backend API. For a deployed admin
app, include its origin in the backend's `CORS_ORIGINS` setting.
