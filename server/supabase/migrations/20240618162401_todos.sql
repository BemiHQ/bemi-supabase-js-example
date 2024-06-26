-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS todos_id_seq;

-- Table Definition
CREATE TABLE "public"."todos" (
    "id" int4 NOT NULL DEFAULT nextval('todos_id_seq'::regclass),
    "task" varchar NOT NULL,
    "isCompleted" bool NOT NULL DEFAULT false,
    PRIMARY KEY ("id")
);
