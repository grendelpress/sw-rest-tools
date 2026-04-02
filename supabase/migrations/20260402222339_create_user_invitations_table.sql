/*
  # Create User Invitations Table

  1. New Tables
    - `user_invitations`
      - `id` (uuid, primary key)
      - `email` (text, email of invited user)
      - `invitation_token` (text, unique token for invitation link)
      - `expires_at` (timestamptz, when invitation expires)
      - `accepted_at` (timestamptz, when invitation was accepted)
      - `created_at` (timestamptz, when invitation was created)
      - `created_by` (uuid, reference to admin who created invitation)

  2. Security
    - Enable RLS on `user_invitations` table
    - Add policy for authenticated users to read invitations
    - Add policy for authenticated users to create invitations
    - Add policy for authenticated users to delete invitations
*/

CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invitation_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read invitations"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invitations"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update invitations"
  ON user_invitations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete invitations"
  ON user_invitations FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
