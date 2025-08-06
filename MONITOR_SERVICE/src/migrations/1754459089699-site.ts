import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class Site1754459089699 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "site",
        columns: [
          {
            name: "id",
            type: "varchar",
            isPrimary: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            isNullable: true,
            default: null,
          },
          {
            name: "trash",
            type: "boolean",
            default: false,
          },
          {
            name: "url",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "userId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "siteName",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "notification",
            type: "boolean",
            default: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "site",
      new TableIndex({
        name: "IDX_SITE_URL",
        columnNames: ["url"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("site", "IDX_SITE_URL");
    await queryRunner.dropTable("site");
  }
}
