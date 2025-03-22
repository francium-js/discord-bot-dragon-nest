import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1742617232760 implements MigrationInterface {
    name = 'Init1742617232760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."characters_class_enum" AS ENUM(
                'gladiator',
                'moon_lord',
                'destroyer',
                'barbarian',
                'dark_avenger',
                'wind_walker',
                'tempest',
                'sniper',
                'artillery',
                'glaciana',
                'saleana',
                'obscuria',
                'illumia',
                'saint',
                'inquisitor',
                'guardian',
                'crusader',
                'adept',
                'physician',
                'shooting_star',
                'gear_master',
                'blade_dancer',
                'soul_eater',
                'dark_summoner',
                'spirit_dancer',
                'ripper',
                'light_fury',
                'raven',
                'abyss_walker',
                'flurry',
                'valkyrie'
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."characters_element_enum" AS ENUM('Light', 'Dark', 'Fire', 'Ice')
        `);
        await queryRunner.query(`
            CREATE TABLE "characters" (
                "id" SERIAL NOT NULL,
                "class" "public"."characters_class_enum" NOT NULL,
                "element" "public"."characters_element_enum" array,
                "name" character varying NOT NULL,
                "userId" integer,
                CONSTRAINT "PK_9d731e05758f26b9315dac5e378" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."partys_element_enum" AS ENUM('Light', 'Dark', 'Fire', 'Ice')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."partys_serverregion_enum" AS ENUM('EU', 'SEA', 'NA', 'SA')
        `);
        await queryRunner.query(`
            CREATE TABLE "partys" (
                "id" SERIAL NOT NULL,
                "element" "public"."partys_element_enum" array,
                "classPriorityLoot" boolean NOT NULL DEFAULT true,
                "timeStart" TIMESTAMP NOT NULL,
                "timeEnd" TIMESTAMP NOT NULL,
                "serverRegion" "public"."partys_serverregion_enum",
                "createdById" integer NOT NULL,
                CONSTRAINT "PK_69d38868e7a05f999367ef1ac00" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "discordId" character varying NOT NULL,
                "joinedPartyId" integer,
                CONSTRAINT "UQ_ae4a93a6b25195ccc2a97e13f0d" UNIQUE ("discordId"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "characters"
            ADD CONSTRAINT "FK_7c1bf02092d401b55ecc243ef1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "partys"
            ADD CONSTRAINT "FK_243657bf093f9250749edd6501d" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "FK_c77d4d85fc86079e9108ca009b6" FOREIGN KEY ("joinedPartyId") REFERENCES "partys"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP CONSTRAINT "FK_c77d4d85fc86079e9108ca009b6"
        `);
        await queryRunner.query(`
            ALTER TABLE "partys" DROP CONSTRAINT "FK_243657bf093f9250749edd6501d"
        `);
        await queryRunner.query(`
            ALTER TABLE "characters" DROP CONSTRAINT "FK_7c1bf02092d401b55ecc243ef1f"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TABLE "partys"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."partys_serverregion_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."partys_element_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "characters"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."characters_element_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."characters_class_enum"
        `);
    }

}
