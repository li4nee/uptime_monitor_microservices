import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";
import { NOTIFICATION_FREQUENCY } from "../typings/base.type";
import { checkIndexKeySchema } from "../utils/base.utils";

export class SiteApiAndNotification1754459110923 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "site_notification_setting",
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
            name: "emailEnabled",
            type: "boolean",
            default: false,
          },
          {
            name: "emailAddress",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "discordEnabled",
            type: "boolean",
            default: false,
          },
          {
            name: "discordWebhook",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "slackEnabled",
            type: "boolean",
            default: false,
          },
          {
            name: "slackWebhook",
            type: "varchar",
            isNullable: true,
          },
          {
            name: "notificationFrequency",
            type: "varchar",
            default: "'ONCE'",
          },
          {
            name: "lastNotificationSentAt",
            type: "timestamp",
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: "site_api",
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
            name: "path",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "isActive",
            type: "boolean",
            default: true,
          },
          {
            name: "httpMethod",
            type: "enum",
            enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
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
            name: "maxResponseTime",
            type: "float",
            isNullable: true,
          },
          {
            name: "maxNumberOfAttempts",
            type: "integer",
            default: 3,
          },
          {
            name: "priority",
            type: "varchar",
            default: "'MEDIUM'",
          },
          {
            name: "siteId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "notificationSettingId",
            type: "varchar",
            isNullable: true,
          },
        ],
      }),
      true,
    );

    const result = await queryRunner.query(checkIndexKeySchema("site_api", "IDX_SITE_API_PATH"));
    if (result.length === 0) {
      await queryRunner.createIndex(
        "site_api",
        new TableIndex({
          name: "IDX_SITE_API_PATH",
          columnNames: ["path"],
        }),
      );
    }

    await queryRunner.createForeignKey(
      "site_api",
      new TableForeignKey({
        columnNames: ["siteId"],
        referencedTableName: "site",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "site_api",
      new TableForeignKey({
        columnNames: ["notificationSettingId"],
        referencedTableName: "site_notification_setting",
        referencedColumnNames: ["id"],
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("site_api");

    const foreignKey1 = table?.foreignKeys.find((fk) => fk.columnNames.includes("siteId"));
    if (foreignKey1) await queryRunner.dropForeignKey("site_api", foreignKey1);

    const foreignKey2 = table?.foreignKeys.find((fk) => fk.columnNames.includes("notificationSettingId"));
    if (foreignKey2) await queryRunner.dropForeignKey("site_api", foreignKey2);

    await queryRunner.dropIndex("site_api", "IDX_SITE_API_PATH");

    await queryRunner.dropTable("site_api");
    await queryRunner.dropTable("siteNotificationSetting");
  }
}
