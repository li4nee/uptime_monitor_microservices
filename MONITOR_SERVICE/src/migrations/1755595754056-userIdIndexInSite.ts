import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class UserIdIndexInSite1755595754056 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex(
      "site",
      new TableIndex({
        name: "IDX_site_userId",
        columnNames: ["userId"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("site", "IDX_site_userId");
  }
}
