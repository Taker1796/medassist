using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface ILlmConfigurationRepository
{
    Task<LlmConfiguration?> GetAsync(CancellationToken cancellationToken);
    Task<LlmConfiguration> UpsertAsync(string endpoint, string? apiKeyHeader, string? apiKey, CancellationToken cancellationToken);
}
