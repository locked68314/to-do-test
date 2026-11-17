import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksTable1794877967631 implements MigrationInterface {
  name = 'CreateTasksTable1794877967631';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" varchar PRIMARY KEY NOT NULL, "title" varchar(120) NOT NULL, "description" text, "status" varchar(20) NOT NULL DEFAULT ('pending'), "assignee" varchar(120) NOT NULL, "due_date" datetime NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_status" ON "tasks" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_assignee" ON "tasks" ("assignee") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_tasks_assignee"`);
    await queryRunner.query(`DROP INDEX "idx_tasks_status"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
