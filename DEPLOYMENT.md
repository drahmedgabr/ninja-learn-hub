# Ninja Learn live deployment

The frontend now reads training content from PHP + MySQL. No mock data or localStorage is used.

## 1. Create the database in cPanel

Use cPanel's Database Wizard / Manage My Databases to create a MySQL or MariaDB database and database user, then give the user access to the database.

Import `database/schema.sql` into that database with phpMyAdmin. If the database already exists, run `database/migrations/001_wasabi_video_storage.sql` instead.

## 2. Configure the PHP API

Copy:

`api/config.php.example`

to:

`api/config.php`

Then set:
- DB_HOST
- DB_NAME
- DB_USER
- DB_PASSWORD
- ADMIN_PASSWORD_HASH
- WASABI_REGION
- WASABI_ENDPOINT
- WASABI_BUCKET
- WASABI_ACCESS_KEY
- WASABI_SECRET_KEY
- WASABI_URL_TTL_SECONDS

Generate the admin password hash on a machine with PHP:

`php -r "echo password_hash('YOUR_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"`

Never commit `api/config.php`.

## 3. Build the frontend

```bash
npm install
npm run build
```

Because the project is hosted under:

`/apps/tatbeqey/apps/ninja-learn-hub/`

Vite is already configured with that base path.

## 4. Upload

Upload the contents of `dist/` to:

`/apps/tatbeqey/apps/ninja-learn-hub/`

Also upload the repository's `api/` directory and `api/config.php` to the same location. Run `composer install --no-dev` in the project root so `vendor/autoload.php` and the AWS SDK are available.

Upload `database/schema.sql` only for setup/reference; it does not need to be public.

The final server layout should include:

```
ninja-learn-hub/
  index.html
  assets/
  vendor/
  composer.json
  api/
    bootstrap.php
    auth.php
    topics.php
    videos.php
    config.php
```

## 5. Admin

Open:

`/apps/tatbeqey/apps/ninja-learn-hub/admin`

Sign in with the password configured in `api/config.php`.

The admin panel can create, edit, and delete topics and videos. Public visitors can only read the training content.

## 6. Future

Watch progress/resume tracking is intentionally not implemented yet. A future version can add users, video progress, and watched-segment tables without replacing the current topic/video structure.
