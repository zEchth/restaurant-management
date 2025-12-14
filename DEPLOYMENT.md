
## Persiapan Server
1.  **OS:** Ubuntu 22.04 LTS (Recommended).
2.  **Tools:** Node.js v18+, NPM, Git, PM2.
3.  **Database:** PostgreSQL (Production) atau SQLite (Simple).

## Langkah Deployment

### 1. Clone & Setup Repository Backend
Di server, clone repository proyek:
```bash
mkdir resto-app
cd reso-app

git clone https://github.com/zEchth/restaurant-management.git
cd restaurant-management
npm install
cp .env.example .env
nano .env  # (Ubah NODE_ENV=production, ganti JWT Secret, dll)

# Setup Database
npx prisma generate
npx prisma db push
node prisma/seed.js  # Jalankan seeder untuk buat akun Admin pertama

```

### 2. Build Frontend
```bash
cd ..
git clone https://github.com/zEchth/restaurant-frontend.git
cd restaurant-frontend
npm install
npm run build
```

### 3. Jalankan Aplikasi dengan PM2
``` bash
cd restaurant-management
pm2 start src/server.js --name "resto-app"
pm2 save
pm2 startup
```

### 4. Konfigurasi Reverse Proxy (Nginx)
```bash
# Agar aplikasi dapat diakses melalui port 80 (HTTP) tanpa mengetik port 3000
# Edit config Nginx: /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Restart Nginx
sudo systemctl restart nginx
```

## Maintenance
``` bash
Update Aplikasi: git pull -> npm run build (frontend) -> pm2 restart resto-app.
Cek Logs: pm2 logs resto-app.
Monitoring: pm2 monit.
```

## Health Check
``` bash 
GET http://<IP-SERVER>/health ```