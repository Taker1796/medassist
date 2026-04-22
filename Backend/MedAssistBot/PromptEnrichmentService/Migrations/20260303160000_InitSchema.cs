using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
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
                Text = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PromptTemplates", x => x.Code);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "PromptTemplates");
    }
}
