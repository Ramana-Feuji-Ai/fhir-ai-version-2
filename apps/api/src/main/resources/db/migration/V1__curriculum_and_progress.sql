-- V1: curriculum + progress schema for FHIR Learning Academy
-- Mirrors SPA model: phases → sections → topics → slides (+ phase resources)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE learner (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name    VARCHAR(120) NOT NULL,
    initials        VARCHAR(8)  NOT NULL,
    external_ref    VARCHAR(120),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE phase (
    id              SMALLINT PRIMARY KEY,          -- keep SPA ids 0..16
    track           VARCHAR(64)  NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT         NOT NULL,
    duration        VARCHAR(64)  NOT NULL,
    sort_order      SMALLINT     NOT NULL,
    objectives      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    outcomes        JSONB        NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_phase_track ON phase (track);

CREATE TABLE section (
    id              BIGSERIAL PRIMARY KEY,
    phase_id        SMALLINT     NOT NULL REFERENCES phase (id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    sort_order      SMALLINT     NOT NULL,
    UNIQUE (phase_id, sort_order)
);

CREATE TABLE topic (
    id              BIGSERIAL PRIMARY KEY,
    section_id      BIGINT       NOT NULL REFERENCES section (id) ON DELETE CASCADE,
    title           VARCHAR(512) NOT NULL,
    summary         TEXT,
    detail_html     TEXT,
    exam_tip        TEXT,
    sort_order      SMALLINT     NOT NULL,
    legacy_key      VARCHAR(32)  NOT NULL,         -- SPA "sectionIndex-topicIndex"
    UNIQUE (section_id, sort_order),
    UNIQUE (section_id, legacy_key)
);

CREATE TABLE topic_key_point (
    id              BIGSERIAL PRIMARY KEY,
    topic_id        BIGINT       NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    sort_order      SMALLINT     NOT NULL,
    body            TEXT         NOT NULL,
    UNIQUE (topic_id, sort_order)
);

CREATE TABLE slide (
    id              BIGSERIAL PRIMARY KEY,
    topic_id        BIGINT       NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    title           VARCHAR(512) NOT NULL,
    body_html       TEXT         NOT NULL,
    sort_order      SMALLINT     NOT NULL,
    UNIQUE (topic_id, sort_order)
);

CREATE INDEX idx_slide_topic ON slide (topic_id);

-- Phase resource packs (specs / examples / lab / quiz) from SPA `resources`
CREATE TABLE phase_spec (
    id              BIGSERIAL PRIMARY KEY,
    phase_id        SMALLINT     NOT NULL REFERENCES phase (id) ON DELETE CASCADE,
    label           VARCHAR(255) NOT NULL,
    url             TEXT         NOT NULL,
    note            TEXT,
    sort_order      SMALLINT     NOT NULL,
    UNIQUE (phase_id, sort_order)
);

CREATE TABLE phase_example (
    id              BIGSERIAL PRIMARY KEY,
    phase_id        SMALLINT     NOT NULL REFERENCES phase (id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    body            TEXT         NOT NULL,
    sort_order      SMALLINT     NOT NULL,
    UNIQUE (phase_id, sort_order)
);

CREATE TABLE phase_lab (
    phase_id        SMALLINT PRIMARY KEY REFERENCES phase (id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    body            TEXT         NOT NULL
);

CREATE TABLE quiz_question (
    id              BIGSERIAL PRIMARY KEY,
    phase_id        SMALLINT     NOT NULL REFERENCES phase (id) ON DELETE CASCADE,
    prompt          TEXT         NOT NULL,
    answer_index    SMALLINT     NOT NULL,
    explanation     TEXT         NOT NULL,
    sort_order      SMALLINT     NOT NULL,
    UNIQUE (phase_id, sort_order)
);

CREATE TABLE quiz_choice (
    id              BIGSERIAL PRIMARY KEY,
    question_id     BIGINT       NOT NULL REFERENCES quiz_question (id) ON DELETE CASCADE,
    body            TEXT         NOT NULL,
    sort_order      SMALLINT     NOT NULL,
    UNIQUE (question_id, sort_order)
);

-- Progress: replaces localStorage key fhi-phase-{id} = ["si-ti", ...]
CREATE TABLE topic_progress (
    learner_id      UUID         NOT NULL REFERENCES learner (id) ON DELETE CASCADE,
    topic_id        BIGINT       NOT NULL REFERENCES topic (id) ON DELETE CASCADE,
    completed       BOOLEAN      NOT NULL DEFAULT TRUE,
    completed_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    PRIMARY KEY (learner_id, topic_id)
);

CREATE INDEX idx_topic_progress_learner ON topic_progress (learner_id);

-- Default demo learner (matches SPA avatar "MR")
INSERT INTO learner (id, display_name, initials, external_ref)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo Learner', 'MR', 'local-demo');
