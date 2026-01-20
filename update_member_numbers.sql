-- Add member_number column
ALTER TABLE members ADD COLUMN IF NOT EXISTS member_number INTEGER;

-- Update existing members with sequential numbers based on created_at
WITH numbered_members AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM members
)
UPDATE members m
SET member_number = nm.row_num
FROM numbered_members nm
WHERE m.id = nm.id;
