/*
  # Create Support Hub Schema

  ## Overview
  This migration creates the database schema for the SignalWire Support Resource Hub,
  enabling the support team to manage and showcase resources, repositories, guides,
  and tools for customers.

  ## 1. New Tables

  ### `categories`
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text) - Display name of the category (e.g., "Messaging", "Voice", "Authentication")
  - `slug` (text, unique) - URL-friendly version of the name
  - `description` (text) - Brief explanation of what this category covers
  - `icon` (text) - Icon identifier or emoji for visual representation
  - `sort_order` (integer) - Controls display order on the site
  - `created_at` (timestamptz) - When the category was created
  - `updated_at` (timestamptz) - Last modification timestamp

  ### `tags`
  - `id` (uuid, primary key) - Unique identifier for each tag
  - `name` (text, unique) - Display name of the tag (e.g., "webhook", "REST API")
  - `slug` (text, unique) - URL-friendly version of the name
  - `created_at` (timestamptz) - When the tag was created

  ### `resources`
  - `id` (uuid, primary key) - Unique identifier for each resource
  - `title` (text) - Display title of the resource
  - `description` (text) - Detailed explanation of what the resource provides
  - `category_id` (uuid, foreign key) - Links to categories table
  - `type` (text) - Type of resource: 'tool', 'guide', 'utility', 'example'
  - `url` (text) - Direct link to the resource (internal or external)
  - `github_url` (text) - GitHub repository URL if applicable
  - `featured` (boolean) - Whether to display on homepage
  - `difficulty_level` (text) - 'beginner', 'intermediate', or 'advanced'
  - `view_count` (integer) - Number of times resource has been viewed
  - `created_at` (timestamptz) - When the resource was created
  - `updated_at` (timestamptz) - Last modification timestamp

  ### `resource_tags`
  - `id` (uuid, primary key) - Unique identifier for the relationship
  - `resource_id` (uuid, foreign key) - Links to resources table
  - `tag_id` (uuid, foreign key) - Links to tags table
  - Composite unique constraint on (resource_id, tag_id)

  ### `repositories`
  - `id` (uuid, primary key) - Unique identifier for each repository
  - `name` (text) - Repository name
  - `description` (text) - What the repository does
  - `github_url` (text) - Full GitHub repository URL
  - `language` (text) - Primary programming language (JavaScript, Python, etc.)
  - `stars` (integer) - GitHub star count
  - `last_updated` (timestamptz) - Last commit or update timestamp
  - `category_id` (uuid, foreign key) - Links to categories table
  - `use_case` (text) - Primary use case or scenario
  - `prerequisites` (text) - Required setup or dependencies
  - `quick_start` (text) - Brief setup instructions
  - `created_at` (timestamptz) - When the repository was added
  - `updated_at` (timestamptz) - Last modification timestamp

  ## 2. Security

  All tables have Row Level Security (RLS) enabled with public read access.
  This allows anyone to view the resources without authentication.
  Write operations will require authentication (for future admin functionality).

  ## 3. Indexes

  Indexes are created on frequently queried fields for optimal performance:
  - category slugs for URL routing
  - tag slugs for filtering
  - resource types and featured status for homepage queries
  - repository languages for filtering
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT '📁',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'guide',
  url text DEFAULT '',
  github_url text DEFAULT '',
  featured boolean DEFAULT false,
  difficulty_level text DEFAULT 'beginner',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resource_tags junction table
CREATE TABLE IF NOT EXISTS resource_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid REFERENCES resources(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(resource_id, tag_id)
);

-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  github_url text NOT NULL,
  language text DEFAULT 'JavaScript',
  stars integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  use_case text DEFAULT '',
  prerequisites text DEFAULT '',
  quick_start text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read tags"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read resources"
  ON resources FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read resource_tags"
  ON resource_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read repositories"
  ON repositories FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_featured ON resources(featured);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_repositories_language ON repositories(language);
CREATE INDEX IF NOT EXISTS idx_repositories_category ON repositories(category_id);

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
  ('API Tools', 'api-tools', 'Interactive tools for working with SignalWire APIs', '🔧', 1),
  ('Messaging', 'messaging', 'SMS, MMS, and messaging integration resources', '💬', 2),
  ('Voice & Calling', 'voice-calling', 'Voice call handling and IVR examples', '📞', 3),
  ('Authentication', 'authentication', 'Security and authentication patterns', '🔐', 4),
  ('Webhooks', 'webhooks', 'Webhook integration and testing tools', '🪝', 5),
  ('Troubleshooting', 'troubleshooting', 'Diagnostic and debugging utilities', '🔍', 6),
  ('Integration Examples', 'integration-examples', 'Code samples and integration guides', '📝', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO tags (name, slug) VALUES
  ('REST API', 'rest-api'),
  ('Webhook', 'webhook'),
  ('JavaScript', 'javascript'),
  ('Python', 'python'),
  ('Node.js', 'nodejs'),
  ('CSV Export', 'csv-export'),
  ('Analytics', 'analytics'),
  ('Beginner Friendly', 'beginner-friendly'),
  ('Advanced', 'advanced'),
  ('LaML', 'laml'),
  ('RELAY', 'relay'),
  ('Phone Numbers', 'phone-numbers'),
  ('Call Logs', 'call-logs'),
  ('Message Logs', 'message-logs')
ON CONFLICT (slug) DO NOTHING;