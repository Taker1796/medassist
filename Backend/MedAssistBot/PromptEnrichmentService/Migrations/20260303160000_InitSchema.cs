using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PromptEnrichmentService.Data;
using PromptEnrichmentService.Constants;

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

        migrationBuilder.Sql($$"""
            INSERT INTO "PromptTemplates" ("Code", "Name", "Text")
            VALUES
                ('{{TemplateCodes.Cardiology}}', 'Кардиология', ''),
                ('{{TemplateCodes.Neurology}}', 'Неврология', ''),
                ('{{TemplateCodes.Pediatrics}}', 'Педиатрия', ''),
                ('{{TemplateCodes.Dermatology}}', 'Дерматология', ''),
                ('{{TemplateCodes.Therapy}}', 'Therapy / Internal medicine', ''),
                ('{{TemplateCodes.Psychiatry}}', 'Психиатрия', ''),
                ('{{TemplateCodes.Gynecology}}', 'Гинекология', ''),
                ('{{TemplateCodes.Default}}', 'Общая практика', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Cardiology)}}', 'S_Кардиология', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Neurology)}}', 'S_Неврология', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Pediatrics)}}', 'S_Педиатрия', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Dermatology)}}', 'S_Дерматология', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Therapy)}}', 'S_Therapy / Internal medicine', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Psychiatry)}}', 'S_Психиатрия', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Gynecology)}}', 'S_Гинекология', ''),
                ('{{TemplateCodes.ToSummaryCode(TemplateCodes.Default)}}', 'S_Общая практика', '');
            """);

    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "PromptTemplates");
    }
}
