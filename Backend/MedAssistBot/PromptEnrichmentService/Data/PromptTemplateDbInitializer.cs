using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Services;

namespace PromptEnrichmentService.Data;

public static class PromptTemplateDbInitializer
{
    private const string SeedFileRelativePath = "SeedData/prompt-templates.seed.json";

    public static async Task InitializeAsync(PromptDbContext dbContext, IWebHostEnvironment environment, ILogger logger, CancellationToken cancellationToken = default)
    {
        var pending = (await dbContext.Database.GetPendingMigrationsAsync(cancellationToken)).ToArray();
        logger.LogInformation("EF pending migrations: {Migrations}", pending.Length == 0 ? "(none)" : string.Join(", ", pending));

        await dbContext.Database.MigrateAsync(cancellationToken);
        await SeedPromptTemplatesAsync(dbContext, environment, logger, cancellationToken);
        await SeedLlmConfigurationAsync(dbContext, logger, cancellationToken);
    }

    private static async Task SeedPromptTemplatesAsync(PromptDbContext dbContext, IWebHostEnvironment environment, ILogger logger, CancellationToken cancellationToken)
    {
        var seedPath = Path.Combine(environment.ContentRootPath, SeedFileRelativePath);
        if (!File.Exists(seedPath))
        {
            throw new FileNotFoundException($"Prompt template seed file not found: {seedPath}");
        }

        await using var stream = File.OpenRead(seedPath);
        var templates = await JsonSerializer.DeserializeAsync<List<PromptTemplate>>(stream, cancellationToken: cancellationToken);
        if (templates == null || templates.Count == 0)
        {
            throw new InvalidOperationException($"Prompt template seed file is empty: {seedPath}");
        }

        var hasExistingTemplates = await dbContext.PromptTemplates.AnyAsync(cancellationToken);
        if (hasExistingTemplates)
        {
            logger.LogInformation("Prompt templates seeding skipped because the table already contains data.");
            return;
        }

        foreach (var template in templates)
        {
            if (string.IsNullOrWhiteSpace(template.Code))
            {
                continue;
            }

            dbContext.PromptTemplates.Add(new PromptTemplate
            {
                Code = template.Code,
                Name = template.Name,
                Text = template.Text
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Prompt templates seeded from {SeedPath}. Templates count: {Count}", seedPath, templates.Count);
    }

    private static async Task SeedLlmConfigurationAsync(PromptDbContext dbContext, ILogger logger, CancellationToken cancellationToken)
    {
        var existing = await dbContext.LlmConfigurations
            .FirstOrDefaultAsync(c => c.Id == LlmConfiguration.DefaultId, cancellationToken);

        if (existing != null)
        {
            return;
        }

        dbContext.LlmConfigurations.Add(new LlmConfiguration
        {
            Id = LlmConfiguration.DefaultId,
            Endpoint = "https://llm.muk.i234.me/v1/generate",
            ApiKeyHeader = "X-Api-Key",
            ApiKey = string.Empty
        });

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Default LLM configuration seeded");
    }
}
