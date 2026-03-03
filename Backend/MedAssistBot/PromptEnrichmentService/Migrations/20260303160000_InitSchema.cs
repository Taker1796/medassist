using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using PromptEnrichmentService.Data;

#nullable disable

namespace PromptEnrichmentService.Migrations;

[DbContext(typeof(PromptDbContext))]
[Migration("20260303160000_InitSchema")]
public partial class InitSchema : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "PromptTemplates",
            columns: table => new
            {
                Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Text = table.Column<string>(type: "text", nullable: false),
                IsDefault = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PromptTemplates", x => x.Code);
            });

        migrationBuilder.CreateTable(
            name: "pacientCards",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                patientId = table.Column<long>(type: "bigint", nullable: false),
                specialtyCode = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                summary = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_pacientCards", x => x.Id);
            });

        migrationBuilder.InsertData(
            table: "PromptTemplates",
            columns: new[] { "Code", "Name", "Text", "IsDefault" },
            values: new object[,]
            {
                { "cardiology", "Кардиология", "", false },
                { "neurology", "Неврология", "", false },
                { "pediatrics", "Педиатрия", "", false },
                { "dermatology", "Дерматология", "", false },
                { "therapy", "Therapy / Internal medicine", "", false },
                { "psychiatry", "Психиатрия", "", false },
                { "mergeSummary", "mergeSummary", "", false },
                { "insertSummary", "insertSummary", "", false },
                { "", "", "", true }
            });

        migrationBuilder.CreateIndex(
            name: "IX_pacientCards_patientId_specialtyCode",
            table: "pacientCards",
            columns: new[] { "patientId", "specialtyCode" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_PromptTemplates_IsDefault",
            table: "PromptTemplates",
            column: "IsDefault");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "pacientCards");

        migrationBuilder.DropTable(
            name: "PromptTemplates");
    }
}
