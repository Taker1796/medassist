using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using PromptEnrichmentService.Data;

#nullable disable

namespace PromptEnrichmentService.Migrations;

[DbContext(typeof(PromptDbContext))]
[Migration("20260301114000_AddDoctorsManyToMany")]
public partial class AddDoctorsManyToMany : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF to_regclass('"PacientCards"') IS NOT NULL AND to_regclass('"pacientCards"') IS NULL THEN
                    ALTER TABLE "PacientCards" RENAME TO "pacientCards";
                END IF;
            END $$;
            """);

        migrationBuilder.CreateTable(
            name: "doctors",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                docorId = table.Column<long>(type: "bigint", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_doctors", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "pacientCardDoctors",
            columns: table => new
            {
                pacientCardId = table.Column<int>(type: "integer", nullable: false),
                doctorId = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_pacientCardDoctors", x => new { x.pacientCardId, x.doctorId });
                table.ForeignKey(
                    name: "FK_pacientCardDoctors_doctors_doctorId",
                    column: x => x.doctorId,
                    principalTable: "doctors",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_pacientCardDoctors_pacientCards_pacientCardId",
                    column: x => x.pacientCardId,
                    principalTable: "pacientCards",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_doctors_docorId",
            table: "doctors",
            column: "docorId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_pacientCardDoctors_doctorId",
            table: "pacientCardDoctors",
            column: "doctorId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "pacientCardDoctors");

        migrationBuilder.DropTable(
            name: "doctors");
    }
}
