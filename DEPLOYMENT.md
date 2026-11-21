# Deploying Pak China Cargo

The website and the API run as **one Node server** (`backend/`). It serves the built website from
`frontend/dist`, the API under `/api/v1`, and `sitemap.xml` / `robots.txt`. Each page's HTML gets its
own title, description and preview image on the server, so Google and WhatsApp/Facebook previews are correct.

```
npm ci --prefix frontend --include=dev && npm run build --prefix frontend   # builds frontend/dist
npm ci --prefix backend --include=dev  && npm run build --prefix backend    # builds backend/dist
npm start --prefix backend                                                  # serves everything on $PORT
```

## Production settings (environment variables)

| Name | Required | What it is |
|---|---|---|
| `NODE_ENV` | yes | `production` (turns on secure cookies) |
| `MONGODB_URI` | yes | MongoDB Atlas connection string, including the database name |
| `JWT_ACCESS_SECRET` | yes | Random string, 32+ characters. Changing it signs every admin out |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | yes | Cloudinary → Settings → API Keys (the key needs upload permission) |
| `SITE_URL` | once you have a domain | e.g. `https://pakchinacargo.com`. Without it the site uses the address it is opened at |
| `PORT` | set by the host | Render sets it; on a VPS use `4000` |
| `COOKIE_SAMESITE` | no | Keep `lax` (website and API are on the same domain) |
| `CORS_ORIGINS` | no | Only needed if another website must call the API |

The database is already seeded (content and the super admin). Do **not** run the seed on the server.
Never commit `.env` files. Only `frontend/.env.production` is committed: it holds no secrets.

---

## A. Free demo on Render

Free plan limits: the service sleeps after 15 minutes without visitors. The first visit after that takes
about 30–50 seconds. Fine for showing the client; the VPS removes this.

1. **MongoDB Atlas → Security → Network Access → Add IP Address → `0.0.0.0/0`.**
   Render's free plan has no fixed IP address. The database stays protected by its username and password.
2. **Put the project on GitHub** (a private repository is fine):
   ```
   git init
   git add .
   git commit -m "Pak China Cargo website"
   ```
   Create an empty private repository on github.com, then run the two `git remote add` / `git push` lines GitHub shows.
3. **Render** (render.com, sign in with GitHub) → **New + → Blueprint** → pick the repository.
   Render reads `render.yaml` and asks for `MONGODB_URI` and the three Cloudinary values. Paste them in. `JWT_ACCESS_SECRET` is generated for you.
4. Wait for the first build (about 5 minutes). Then open `https://pak-china-cargo.onrender.com`
   (Render shows the exact address) and sign in at `/admin` with your existing admin account.
5. Every `git push` to the main branch redeploys automatically.

**Check after deploying:** the home page loads; `/sitemap.xml` lists the services; the quote form sends; admin sign-in works;
an image upload works; sharing a page link on WhatsApp shows its title and image.

---

## B. Later: VPS (Ubuntu 24.04, e.g. 1 GB RAM or more)

1. **Point the domain** at the server: an `A` record for `@` and `www` → the VPS IP.
2. **Install Node 22, Nginx, Certbot and PM2:**
   ```
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs nginx certbot python3-certbot-nginx git
   sudo npm install -g pm2
   ```
3. **Get the code and build it:**
   ```
   git clone <your repository> /var/www/pak-china-cargo
   cd /var/www/pak-china-cargo
   npm ci --prefix frontend --include=dev && npm run build --prefix frontend
   npm ci --prefix backend --include=dev  && npm run build --prefix backend
   ```
4. **Create `backend/.env`** with the settings from the table above (`NODE_ENV=production`, `PORT=4000`, `SITE_URL=https://yourdomain.com`).
5. **Start it and keep it running after reboots:**
   ```
   pm2 start npm --name pak-china-cargo -- start --prefix backend
   pm2 save && pm2 startup
   ```
6. **Nginx** (`/etc/nginx/sites-available/pak-china-cargo`, then link it into `sites-enabled` and `sudo nginx -s reload`):
   ```nginx
   server {
     server_name yourdomain.com www.yourdomain.com;
     client_max_body_size 10m;
     location / {
       proxy_pass http://127.0.0.1:4000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```
7. **Free HTTPS certificate:** `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
8. **Atlas:** replace `0.0.0.0/0` with the VPS's IP address only.
9. **Search engines:** add the site in Google Search Console and submit `https://yourdomain.com/sitemap.xml`.

**Updating later:** `git pull`, run the two build lines, then `pm2 restart pak-china-cargo`.
