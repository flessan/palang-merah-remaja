-- Neon/Postgres schema for PMR Wira.
-- Run this file once in the Neon SQL editor, then deploy the Pages site.

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'Kabar PMR',
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  date_label TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date_label TEXT,
  time_label TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Informasi',
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS gallery_albums (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  date_label TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'Kegiatan',
  cover_url TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  class_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS announcements_published_idx ON announcements (published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS gallery_event_date_idx ON gallery_albums (event_date DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS registrations_created_idx ON registrations (created_at DESC);

-- Keep all editable copy in JSON so the public API stays small and easy to maintain.
-- The complete seed is in db/seed.sql.
