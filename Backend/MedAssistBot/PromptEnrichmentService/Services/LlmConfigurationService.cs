using Microsoft.Extensions.Caching.Memory;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;

namespace PromptEnrichmentService.Services;

public class LlmConfigurationService
{
    public const string CacheKey = "llm_configuration";

    private readonly ILlmConfigurationRepository _repository;
    private readonly IMemoryCache _memoryCache;

    public LlmConfigurationService(ILlmConfigurationRepository repository, IMemoryCache memoryCache)
    {
        _repository = repository;
        _memoryCache = memoryCache;
    }

    public Task<LlmConfiguration?> GetAsync(CancellationToken cancellationToken)
    {
        return _memoryCache.GetOrCreateAsync<LlmConfiguration?>(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
            return await _repository.GetAsync(cancellationToken);
        })!;
    }

    public async Task<LlmConfiguration> UpdateAsync(string endpoint, string? apiKeyHeader, string? apiKey, CancellationToken cancellationToken)
    {
        var configuration = await _repository.UpsertAsync(endpoint, apiKeyHeader, apiKey, cancellationToken);
        _memoryCache.Remove(CacheKey);
        return configuration;
    }

    public void InvalidateCache()
    {
        _memoryCache.Remove(CacheKey);
    }
}
