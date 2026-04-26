# Military Backend API - Setup Lengkap

Backend API untuk sistem manajemen logistik militer dengan database MySQL dan autentikasi JWT.

## 📋 Prerequisites (Yang Harus Diinstall Dulu)

Sebelum setup aplikasi ini, pastikan Anda sudah menginstall software berikut:

### 1. Node.js (Version 18 atau lebih baru)
- **Download**: https://nodejs.org/
- **Cara cek**: Buka terminal/cmd dan ketik `node --version`
- **Expected output**: `v18.x.x` atau `v20.x.x`

### 2. Docker Desktop (Untuk setup dengan Docker)
- **Download**: https://www.docker.com/products/docker-desktop/
- **Cara cek**: Buka terminal/cmd dan ketik `docker --version`
- **Expected output**: `Docker version 24.x.x`

### 3. Git (Untuk clone repository)
- **Download**: https://git-scm.com/downloads
- **Cara cek**: Buka terminal/cmd dan ketik `git --version`
- **Expected output**: `git version 2.x.x`

### 4. Code Editor (VS Code Recommended)
- **Download**: https://code.visualstudio.com/
- **Extensions yang direkomendasikan**:
  - JavaScript (ES6) code snippets
  - Prettier - Code formatter
  - Thunder Client (untuk testing API)

### 5. Postman (Untuk testing API)
- **Download**: https://www.postman.com/downloads/
- **Alternatif**: Thunder Client extension di VS Code

## 🚀 Setup Aplikasi - 2 Cara

### Cara 1: Setup dengan Docker (RECOMMENDED - PALING MUDAH)

#### Step 1: Clone Repository
```bash
git clone https://github.com/athaadam/military-BE.git
cd military-BE
```

#### Step 2: Build dan Run dengan Docker
```bash
# Build dan run semua services (MySQL + Node.js app)
docker-compose up --build

# Atau run di background
docker-compose up -d --build
```

#### Step 3: Cek apakah aplikasi sudah running
- Buka browser: http://localhost:3000
- Anda akan melihat: `API route jalan 🚀`
- Database MySQL otomatis ter-setup di port 3306

#### Step 4: Test API
- Import file `postman_collection.json` ke Postman
- Test endpoint `/api/auth/register` untuk register user pertama

### Cara 2: Setup Manual (Tanpa Docker)

#### Step 1: Clone Repository
```bash
git clone https://github.com/athaadam/military-BE.git
cd military-BE
```

#### Step 2: Install MySQL Server
- **Windows**: Download dari https://dev.mysql.com/downloads/mysql/
- **macOS**: `brew install mysql`
- **Ubuntu/Debian**: `sudo apt install mysql-server`

#### Step 3: Setup Database MySQL
```bash
# Login ke MySQL sebagai root
mysql -u root -p

# Buat database
CREATE DATABASE military_db;

# Exit MySQL
exit;
```

#### Step 4: Import Schema Database
```bash
# Import struktur tabel
mysql -u root -p military_db < init.sql
```

#### Step 5: Install Dependencies Node.js
```bash
npm install
```

#### Step 6: Setup Environment Variables
File `.env` sudah tersedia dengan konfigurasi default:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=military_db
JWT_SECRET=military_secret_key

# Database URL
DATABASE_URL="mysql://root:your_mysql_password@localhost:3306/military_db"
```

**PENTING**: Ganti `your_mysql_password` dengan password MySQL root Anda!

#### Step 7: Run Aplikasi
```bash
# Development mode (recommended)
npm run dev

# Atau production mode
npm start
```

#### Step 8: Cek apakah aplikasi sudah running
- Buka browser: http://localhost:3000
- Anda akan melihat: `API route jalan 🚀`

## 📦 Dependencies Yang Terinstall

Setelah `npm install`, aplikasi ini akan menginstall package berikut:

### Production Dependencies:
- `express` (^5.2.1) - Web framework untuk Node.js
- `mysql2` (^3.22.2) - MySQL driver untuk Node.js
- `cors` (^2.8.6) - Cross-Origin Resource Sharing
- `dotenv` (^17.4.0) - Environment variables loader
- `bcryptjs` (^3.0.3) - Password hashing
- `jsonwebtoken` (^9.0.3) - JWT authentication

### Development Dependencies:
- `nodemon` (^3.1.14) - Auto-restart server saat development

## 🗄️ Struktur Database

Aplikasi ini menggunakan MySQL dengan 8 tabel utama:

### Tabel yang Dibuat Otomatis:
1. **`unit`** - Data satuan militer
2. **`user`** - Data user dengan role admin/user
3. **`warehouse`** - Data gudang penyimpanan
4. **`item`** - Data barang inventory
5. **`request`** - Data permintaan barang
6. **`return`** - Data pengembalian barang
7. **`repair`** - Data perbaikan barang
8. **`log`** - Log aktivitas user

### File Database:
- **`init.sql`** - Script SQL untuk membuat tabel dan struktur database
- **Docker**: Database otomatis dibuat saat `docker-compose up`
- **Manual**: Import `init.sql` ke MySQL database Anda

## 🔧 Environment Variables Lengkap

Buat file `.env` di root project dengan isi:

```env
# Database Configuration
DB_HOST=localhost          # Host database (localhost untuk local)
DB_USER=root              # Username MySQL
DB_PASS=your_password     # Password MySQL root
DB_NAME=military_db       # Nama database

# JWT Configuration
JWT_SECRET=military_secret_key  # Secret key untuk JWT (ganti dengan random string)

# Server Configuration
PORT=3000                 # Port server (default: 3000)

# Database URL (untuk Prisma jika digunakan)
DATABASE_URL="mysql://root:your_password@localhost:3306/military_db"
```

## 🧪 Testing API

### Dengan Postman:
1. **Import Collection**:
   - Buka Postman
   - Import file `postman_collection.json`
   - Set variable `baseUrl` = `http://localhost:3000`

2. **Test Flow**:
   - Register user baru → `/api/auth/register`
   - Login → `/api/auth/login` (token otomatis tersimpan)
   - Test endpoint lainnya dengan Authorization header

### Dengan Thunder Client (VS Code):
1. **Install Extension**: Thunder Client di VS Code
2. **Import Collection**: Import `postman_collection.json`
3. **Test**: Sama seperti Postman

### Manual Testing dengan cURL:

#### Register User:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "unitId": 1
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

## 🐳 Docker Commands Lengkap

### Basic Commands:
```bash
# Build dan run
docker-compose up --build

# Run di background
docker-compose up -d --build

# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# View logs specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Advanced Commands:
```bash
# Rebuild specific service
docker-compose up --build app

# Remove containers dan volumes
docker-compose down -v

# View running containers
docker ps

# Access MySQL container
docker exec -it military_mysql mysql -u root -p military_db

# View container logs real-time
docker-compose logs -f --tail=100
```

## 🔧 Troubleshooting

### Error: "Cannot find module"
```bash
# Install ulang dependencies
rm -rf node_modules package-lock.json
npm install
```

### Error: "Database connection error"
```bash
# Cek MySQL service
docker-compose ps

# Restart database
docker-compose restart db

# Cek logs database
docker-compose logs db
```

### Error: "Port 3000 already in use"
```bash
# Kill process di port 3000
npx kill-port 3000

# Atau ganti port di .env
PORT=3001
```

### Error: "Access denied for user 'root'@'172.x.x.x'"
- Pastikan password di `.env` sama dengan MySQL root password
- Untuk Docker: password default adalah `rootpassword`

### Error: "Table doesn't exist"
```bash
# Import ulang schema
docker exec -i military_mysql mysql -u root -prootpassword military_db < init.sql
```

### Error: "JWT token invalid"
- Pastikan `JWT_SECRET` di `.env` konsisten
- Token expired setelah 8 jam, login ulang

## 📊 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/units` | Get all units | ✅ (Admin) |
| POST | `/api/units` | Create unit | ✅ (Admin) |
| GET | `/api/warehouses` | Get warehouses | ✅ (Admin) |
| POST | `/api/warehouses` | Create warehouse | ✅ (Admin) |
| GET | `/api/items` | Get items | ✅ |
| POST | `/api/items` | Create item | ✅ |
| POST | `/api/requests` | Create request | ✅ |
| GET | `/api/requests/my` | Get my requests | ✅ |
| PATCH | `/api/requests/:id/approve` | Approve request | ✅ (Admin) |
| POST | `/api/returns` | Create return | ✅ |

## 🎯 Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Install Docker Desktop
- [ ] Install Git
- [ ] Clone repository
- [ ] Run `docker-compose up --build`
- [ ] Import Postman collection
- [ ] Register user pertama
- [ ] Test API endpoints

## 📞 Support

Jika ada masalah:
1. Cek logs: `docker-compose logs -f`
2. Pastikan semua prerequisites terinstall
3. Cek environment variables di `.env`
4. Test dengan Postman collection

## 📝 Catatan Penting

- **Docker Setup**: Recommended untuk development dan production
- **Database**: MySQL 8.0 dengan auto-initialization
- **Security**: JWT authentication + bcrypt password hashing
- **Validation**: Input validation untuk semua foreign keys
- **CORS**: Enabled untuk cross-origin requests

---

**Happy Coding! 🚀**