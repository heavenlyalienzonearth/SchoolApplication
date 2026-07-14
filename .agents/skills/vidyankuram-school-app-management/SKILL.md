---
name: vidyankuram-school-app-management
description: Detailed procedures for maintaining, building, seeding, deploying, and migrating the Vidyankuram School Application.
---

# Vidyankuram School Application Management Skill

## Overview
This skill provides instructions for managing, building, database seeding, deploying, and migrating the Vidyankuram School Application (FastAPI backend + Angular frontend + SQL Server Docker container).

## Dependencies
- `pyodbc` (Python library for SQL Server connection)
- `mssql-release` (Microsoft`s ODBC Driver for SQL Server)
- `nginx` (Web server reverse proxy)
- `certbot` (SSL certificate manager)
- `docker` (For SQL Server container)

## Quick Start
To perform a common maintenance task, use the instructions in the sections below.

## Utility Commands

### 🖥️ Local Frontend Build
Build the Angular frontend locally before pushing to production:
```bash
cd E:\AI_Applications\SchoolApplication\frontend
npm run build
```

### 🛢️ Recreating SQL Server Docker Container
If the SQL Server Docker container needs to be started fresh:
```bash
sudo docker stop mssql_server
sudo docker rm mssql_server
sudo docker volume prune -f
sudo docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword" \
   -p 1433:1433 \
   --name mssql_server \
   --restart always \
   -d mcr.microsoft.com/mssql/server:2022-latest
```

### ⚙️ Seeding the Database
Runs table creation and inserts default master data:
```bash
cd /var/www/school-app/backend
source venv/bin/activate
python3 seed.py
```
*(Note: Always run `sudo systemctl restart fastapi` after seeding).*

### 🌐 Deploying Frontend Build to VPS
After pushing the `frontend/dist/` build to GitHub, pull it on the server:
```bash
cd /var/www/school-app
git pull
sudo chown -R www-data:www-data /var/www/school-app
sudo systemctl restart nginx
```

### 🔒 Re-installing SSL Certificate (DNS Challenge)
If the HTTP challenge fails, use the manual DNS challenge:
```bash
sudo certbot certonly --manual --preferred-challenges dns -d deepfusion.cloud -d www.deepfusion.cloud
```
Add the `_acme-challenge` TXT records in Hostinger hPanel, wait 2 minutes, and press Enter. Then install:
```bash
sudo certbot install --nginx -d deepfusion.cloud -d www.deepfusion.cloud
```

### 🔀 Database Migration (Local -> Prod)
Run the migration script on your local Windows machine to transfer data:
```bash
cd E:\AI_Applications\SchoolApplication\backend
.\venv\Scripts\activate
python C:\Users\ADMIN\.gemini\antigravity\brain\59618c06-7730-45b4-9978-133a54823ec6\migrate_local_to_prod.py
```

## Common Mistakes
1. **Masked Password in seed.py:** Never use `str(url_obj)` directly to generate a database URL in SQLAlchemy 2.0+, as it obfuscates the password with `***`. Always use `.render_as_string(hide_password=False)`.
2. **Carriage Returns in .env:** Creating `.env` files on Windows and uploading them to Linux can introduce hidden `\r` carriage returns, corrupting environment values. Always save as LF (Unix line endings).
3. **Port Conflict:** If Docker run fails, verify that port 1433 is not already occupied using `sudo docker ps -a` or `ss -tulpn | grep 1433`.
