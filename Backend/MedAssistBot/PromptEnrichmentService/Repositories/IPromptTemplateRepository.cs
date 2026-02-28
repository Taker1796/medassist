using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPromptTemplateRepository
{
    Task<PromptTemplate?> GetBySpecialtyOrDefaultAsync(string? specialtyCode, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<PromptTemplate>> GetAllAsync(CancellationToken cancellationToken);
    Task<(PromptTemplate Template, bool Created)> UpsertAsync(int? templateId, string? specialtyCode, string templateText, bool isDefault, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int templateId, CancellationToken cancellationToken);
}
