-- Client tier (trial vs full) and handled-by team assignment

CREATE TYPE client_tier AS ENUM ('trial', 'full');

ALTER TABLE clients
  ADD COLUMN client_tier client_tier NOT NULL DEFAULT 'full',
  ADD COLUMN handled_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_clients_handled_by ON clients(handled_by_id);
CREATE INDEX idx_clients_client_tier ON clients(client_tier);

-- Backfill default handlers when matching profiles exist
UPDATE clients
SET handled_by_id = (
  SELECT id FROM profiles
  WHERE full_name ILIKE 'Emmanuel Akatobi%'
  LIMIT 1
)
WHERE client_tier = 'trial' AND handled_by_id IS NULL;

UPDATE clients
SET handled_by_id = (
  SELECT id FROM profiles
  WHERE full_name ILIKE 'Chidiebere Ekwedike%'
  LIMIT 1
)
WHERE client_tier = 'full' AND handled_by_id IS NULL;
