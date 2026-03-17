using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPromptTemplateRepository
{
    Task<PromptTemplate?> GetByCodeAsync(string code, CancellationToken cancellationToken);
    Task<PromptTemplate?> GetDefaultAsync(CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PromptTemplate>> GetAllAsync(CancellationToken cancellationToken);
    Task<PromptTemplate?> UpdateTextAsync(string code, string? text, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(string code, CancellationToken cancellationToken);
}
