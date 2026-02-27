using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PromptEnrichmentService.Migrations;

public partial class AddSpecialtiesTable : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Specialties",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Specialties", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Specialties_Code",
            table: "Specialties",
            column: "Code",
            unique: true);

        migrationBuilder.AddColumn<int>(
            name: "SpecialtyId",
            table: "PromptTemplates",
            type: "integer",
            nullable: true);

        migrationBuilder.Sql("""
            INSERT INTO "Specialties" ("Code")
            SELECT DISTINCT TRIM("SpecialtyCode")
            FROM "PromptTemplates"
            WHERE "SpecialtyCode" IS NOT NULL
              AND LENGTH(TRIM("SpecialtyCode")) > 0
            ON CONFLICT ("Code") DO NOTHING;
            """);

        migrationBuilder.Sql("""
            UPDATE "PromptTemplates" pt
            SET "SpecialtyId" = s."Id"
            FROM "Specialties" s
            WHERE pt."SpecialtyCode" IS NOT NULL
              AND TRIM(pt."SpecialtyCode") = s."Code";
            """);

        migrationBuilder.CreateIndex(
            name: "IX_PromptTemplates_IsDefault",
            table: "PromptTemplates",
            column: "IsDefault");

        migrationBuilder.CreateIndex(
            name: "IX_PromptTemplates_SpecialtyId",
            table: "PromptTemplates",
            column: "SpecialtyId");

        migrationBuilder.AddForeignKey(
            name: "FK_PromptTemplates_Specialties_SpecialtyId",
            table: "PromptTemplates",
            column: "SpecialtyId",
            principalTable: "Specialties",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);

        migrationBuilder.DropIndex(
            name: "IX_PromptTemplates_SpecialtyCode",
            table: "PromptTemplates");

        migrationBuilder.DropColumn(
            name: "SpecialtyCode",
            table: "PromptTemplates");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SpecialtyCode",
            table: "PromptTemplates",
            type: "character varying(64)",
            maxLength: 64,
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE "PromptTemplates" pt
            SET "SpecialtyCode" = s."Code"
            FROM "Specialties" s
            WHERE pt."SpecialtyId" = s."Id";
            """);

        migrationBuilder.DropForeignKey(
            name: "FK_PromptTemplates_Specialties_SpecialtyId",
            table: "PromptTemplates");

        migrationBuilder.DropIndex(
            name: "IX_PromptTemplates_IsDefault",
            table: "PromptTemplates");

        migrationBuilder.DropIndex(
            name: "IX_PromptTemplates_SpecialtyId",
            table: "PromptTemplates");

        migrationBuilder.DropColumn(
            name: "SpecialtyId",
            table: "PromptTemplates");

        migrationBuilder.CreateIndex(
            name: "IX_PromptTemplates_SpecialtyCode",
            table: "PromptTemplates",
            column: "SpecialtyCode");

        migrationBuilder.DropTable(
            name: "Specialties");
    }
}
