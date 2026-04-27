using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Data;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public class LlmConfigurationRepository : ILlmConfigurationRepository
{
    private readonly PromptDbContext _dbContext;

    public LlmConfigurationRepository(PromptDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<LlmConfiguration?> GetAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.LlmConfigurations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == LlmConfiguration.DefaultId, cancellationToken);
    }

    public async Task<LlmConfiguration> UpsertAsync(string endpoint, string? apiKeyHeader, string? apiKey, CancellationToken cancellationToken)
    {
        var normalizedEndpoint = endpoint?.Trim() ?? string.Empty;
        var normalizedApiKeyHeader = apiKeyHeader?.Trim() ?? string.Empty;
        var normalizedApiKey = apiKey?.Trim() ?? string.Empty;

        var configuration = await _dbContext.LlmConfigurations
            .FirstOrDefaultAsync(c => c.Id == LlmConfiguration.DefaultId, cancellationToken);

        if (configuration == null)
        {
            configuration = new LlmConfiguration
            {
                Id = LlmConfiguration.DefaultId,
                Endpoint = normalizedEndpoint,
                ApiKeyHeader = normalizedApiKeyHeader,
                ApiKey = normalizedApiKey
            };

            _dbContext.LlmConfigurations.Add(configuration);
        }
        else
        {
            configuration.Endpoint = normalizedEndpoint;
            configuration.ApiKeyHeader = normalizedApiKeyHeader;
            configuration.ApiKey = normalizedApiKey;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return configuration;
    }
}
