import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261029000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "qz_signing_key" ("id" text not null, "private_key_pem" text not null, "certificate_pem" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "qz_signing_key_pkey" primary key ("id"));`)
    this.addSql(`create index if not exists "IDX_qz_signing_key_deleted_at" on "qz_signing_key" ("deleted_at") where deleted_at is null;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "qz_signing_key" cascade;`)
  }
}
