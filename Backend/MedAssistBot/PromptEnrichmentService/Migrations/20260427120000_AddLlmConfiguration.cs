using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PromptEnrichmentService.Data;

#nullable disable

namespace PromptEnrichmentService.Migrations;

[DbContext(typeof(PromptDbContext))]
[Migration("20260427120000_AddLlmConfiguration")]
public partial class AddLlmConfiguration : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "LlmConfigurations",
            columns: table => new
            {
                Id = table.Column<int>(type: "integer", nullable: false),
                Endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                ApiKeyHeader = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                ApiKey = table.Column<string>(type: "text", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LlmConfigurations", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "LlmConfigurations");
    }
}
