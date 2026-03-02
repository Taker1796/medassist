using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using PromptEnrichmentService.Data;

#nullable disable

namespace PromptEnrichmentService.Migrations;

[DbContext(typeof(PromptDbContext))]
[Migration("20260301110000_AddPacientCards")]
public partial class AddPacientCards : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "pacientCards",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                patientId = table.Column<long>(type: "bigint", nullable: false),
                summary = table.Column<string>(type: "text", nullable: false),
                specialtyId = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_pacientCards", x => x.Id);
                table.ForeignKey(
                    name: "FK_pacientCards_Specialties_specialtyId",
                    column: x => x.specialtyId,
                    principalTable: "Specialties",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_pacientCards_specialtyId",
            table: "pacientCards",
            column: "specialtyId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "pacientCards");
    }
}
