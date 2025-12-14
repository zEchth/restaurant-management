## Persiapan Server

1.  **OS:** Ubuntu 22.04 LTS (Recommended).
2.  **Tools:** Node.js v18+, NPM, Git, PM2.
3.  **Database:** PostgreSQL (Production) atau SQLite (Simple).

## Langkah Deployment

### 1. Clone & Setup Repository Backend

Di server, clone repository proyek:

```bash
mkdir resto-app
cd resto-app

git clone https://github.com/zEchth/restaurant-management.git
cd restaurant-management
npm install
cp .env.example .env
nano .env  # (Ubah NODE_ENV=production, ganti JWT Secret, dll) 
# --> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

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

```bash
cd restaurant-management
pm2 start src/server.js --name "resto-app"
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu # atau apapun yg muncul setelah pm2 startup systemd
pm2 save
```

### 4. Konfigurasi Reverse Proxy (Nginx)

```bash
# Agar aplikasi dapat diakses melalui port 80 (HTTP) tanpa mengetik port 3000
# Edit config Nginx: /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        root /var/www/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Monitoring & Logs
```bash
pm2 install pm2-logrotate
pm2 status
pm2 logs resto-app
pm2 monit
```

## Maintenance

```bash
git pull
cd restaurant-frontend
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
pm2 restart resto-app
```

## Health Check

````bash
GET http://<IP-SERVER>/api/health 

# Login
curl -X POST http://<IP-SERVER>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kafe.com","password":"password123"}'
```
