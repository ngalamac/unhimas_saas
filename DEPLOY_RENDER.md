Render deployment steps for unhimas_saas

1. Push this repository to GitHub and note the HTTPS URL.

2. Update `render.yaml` at repository root: replace `TODO_REPO_URL` with your GitHub repo URL.

3. In Render dashboard:
   - Create a new Static Site using the `unhimas-frontend` service from `render.yaml` (it will be auto-detected). Branch: `deploymount`.
   - Create a new Web Service using the `unhimas-backend` service. Branch: `deploymount`.

4. Add environment variables to the backend service (Dashboard > Environment):
   - `MONGO_URI` (required) — your MongoDB connection string
   - Any email/SMTP creds, storage keys, or other secrets used by the backend

5. Backend notes:
   - The backend `build` runs `tsc` and emits to `backend/dist`.
   - `start` runs `node ./dist/server.js`. Ensure the `main` entry in `backend/package.json` (now `src/server.ts`) aligns; the built file will be at `dist/server.js`.
   - Render sets `PORT` for you; the server reads `process.env.PORT`.

6. Check logs and open the deployed services. Health check path: `/api/health`.

Troubleshooting:
- If deployment fails due to native module `sharp` or other build tools, enable the "Use the default instance's build environment" or add a Render build pack that includes libvips.
- For static frontend, you can also deploy the `dist` directory manually if needed.

Using Docker on Render (recommended for native modules):

- Render can deploy a Docker image. Use the provided `backend/Dockerfile` to build a reproducible image that includes native build deps required by packages like `sharp`.
- To use the Dockerfile on Render, create a new Web Service and select "Docker" as the Environment. Render will build the image using this Dockerfile.

Recommended environment variables (backend):

- MONGO_URI (required) — MongoDB connection string
- JWT_SECRET — secret used to sign JWT tokens
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — if you send emails
- S3_BUCKET, S3_KEY, S3_SECRET — if using S3-compatible storage
- NODE_ENV=production

If you prefer the manifest approach, Render will still accept this Dockerfile if you change the service type to `docker` in `render.yaml`.
