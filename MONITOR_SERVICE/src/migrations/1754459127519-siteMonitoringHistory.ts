import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";
import { checkIndexKeySchema } from "../utils/base.utils";

export class SiteMonitoringHistory1754459127519 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "site_monitoring_history",
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
          },
          {
            name: "trash",
            type: "boolean",
            default: false,
          },
          {
            name: "status",
            type: "varchar",
          },
          {
            name: "statusCode",
            type: "integer",
          },
          {
            name: "siteId",
            type: "varchar",
          },
          {
            name: "siteApiId",
            type: "varchar",
          },
          {
            name: "completeUrl",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "responseTime",
            type: "float",
          },
          {
            name: "errorLog",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "httpMethod",
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
            type: "enum",
            default: "'GET'",
          },
          {
            name: "headers",
            type: "json",
            isNullable: true,
          },
          {
            name: "body",
            type: "json",
            isNullable: true,
          },
          {
            name: "checkedAt",
            type: "timestamp",
          },
          {
            name: "attemptNumber",
            type: "integer",
            default: 1,
          },
          {
            name: "wasNotificationSent",
            type: "boolean",
            default: false,
          },
          {
            name: "notificationSentTo",
            type: "json",
            isNullable: true,
          },
        ],
      }),
      true,
    );

    let queryResult = await queryRunner.query(checkIndexKeySchema("site_monitoring_history", "IDX_MONITORING_HISTORY_CHECKED_AT"));

    if (queryResult.length === 0) {
      await queryRunner.createIndex(
        "site_monitoring_history",
        new TableIndex({
          name: "IDX_MONITORING_HISTORY_CHECKED_AT",
          columnNames: ["checkedAt"],
        }),
      );
    }

    queryResult = await queryRunner.query(checkIndexKeySchema("site_monitoring_history", "IDX_MONITORING_HISTORY_COMPLETE_URL"));

    if (queryResult.length === 0) {
      await queryRunner.createIndex(
        "site_monitoring_history",
        new TableIndex({
          name: "IDX_MONITORING_HISTORY_COMPLETE_URL",
          columnNames: ["completeUrl"],
        }),
      );
    }


    await queryRunner.createForeignKey(
      "site_monitoring_history",
      new TableForeignKey({
        columnNames: ["siteId"],
        referencedTableName: "site",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "site_monitoring_history",
      new TableForeignKey({
        columnNames: ["siteApiId"],
        referencedTableName: "site_api",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("site_monitoring_history");

    if (table) {
      const siteFK = table.foreignKeys.find((fk) => fk.columnNames.includes("siteId"));
      if (siteFK) await queryRunner.dropForeignKey("site_monitoring_history", siteFK);

      const siteApiFK = table.foreignKeys.find((fk) => fk.columnNames.includes("siteApiId"));
      if (siteApiFK) await queryRunner.dropForeignKey("site_monitoring_history", siteApiFK);
    }

    await queryRunner.dropIndex("site_monitoring_history", "IDX_MONITORING_HISTORY_CHECKED_AT");
    await queryRunner.dropIndex("site_monitoring_history", "IDX_MONITORING_HISTORY_COMPLETE_URL");
    await queryRunner.dropTable("site_monitoring_history");
  }
}
