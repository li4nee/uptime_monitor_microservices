import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class SiteSLAreport1755587362827 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "site_sla_report",
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
            name: "siteId",
            type: "varchar",
            isNullable: false,
          },
          {
            name: "periodStart",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "periodEnd",
            type: "timestamp",
            isNullable: false,
          },
          {
            name: "totalChecks",
            type: "int",
            default: 0,
          },
          {
            name: "upChecks",
            type: "int",
            default: 0,
          },
          {
            name: "downChecks",
            type: "int",
            default: 0,
          },
          {
            name: "uptimePercentage",
            type: "float",
            isNullable: true,
          },
          {
            name: "averageResponseTime",
            type: "float",
            isNullable: true,
          },
          {
            name: "maxResponseTime",
            type: "float",
            isNullable: true,
          },
          {
            name: "minResponseTime",
            type: "float",
            isNullable: true,
          },
          {
            name: "slowResponseCount",
            type: "int",
            default: 0,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "site_sla_report",
      new TableIndex({
        name: "IDX_site_sla_report_periodStart",
        columnNames: ["periodStart"],
      }),
    );

    await queryRunner.createIndex(
      "site_sla_report",
      new TableIndex({
        name: "IDX_site_sla_report_periodEnd",
        columnNames: ["periodEnd"],
      }),
    );

    await queryRunner.createForeignKey(
      "site_sla_report",
      new TableForeignKey({
        columnNames: ["siteId"],
        referencedTableName: "site",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("site_sla_report");
    const foreignKey = table!.foreignKeys.find((fk) => fk.columnNames.indexOf("siteId") !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey("site_sla_report", foreignKey);
    }
    const indexStart = table!.indices.find((idx) => idx.columnNames.indexOf("periodStart") !== -1);
    if (indexStart) {
      await queryRunner.dropIndex("site_sla_report", indexStart);
    }
    const indexEnd = table!.indices.find((idx) => idx.columnNames.indexOf("periodEnd") !== -1);
    if (indexEnd) {
      await queryRunner.dropIndex("site_sla_report", indexEnd);
    }
    await queryRunner.dropTable("site_sla_report");
  }
}
