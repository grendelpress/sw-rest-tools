/*
  # Add Admin Write Policies

  ## Overview
  This migration adds write policies for authenticated users to manage resources,
  repositories, categories, and tags. This enables the admin interface to function.

  ## Security Notes
  - All write operations require authentication
  - Public users can still read all content
  - Consider adding role-based access control in future for production use
*/

-- Categories write policies
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Tags write policies
CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (true);

-- Resources write policies
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (true);

-- Resource tags write policies
CREATE POLICY "Authenticated users can insert resource_tags"
  ON resource_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete resource_tags"
  ON resource_tags FOR DELETE
  TO authenticated
  USING (true);

-- Repositories write policies
CREATE POLICY "Authenticated users can insert repositories"
  ON repositories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update repositories"
  ON repositories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete repositories"
  ON repositories FOR DELETE
  TO authenticated
  USING (true);