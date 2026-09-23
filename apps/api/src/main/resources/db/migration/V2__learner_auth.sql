-- V2: learner login credentials (email + password hash)

ALTER TABLE learner
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(100),
    ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'LEARNER';

-- Bootstrap demo account (password set by AuthBootstrap on startup)
UPDATE learner
SET email = COALESCE(email, 'mr@fhi.local'),
    role = COALESCE(NULLIF(role, ''), 'LEARNER')
WHERE id = '11111111-1111-1111-1111-111111111111';

CREATE UNIQUE INDEX IF NOT EXISTS uq_learner_email ON learner (email)
    WHERE email IS NOT NULL;
