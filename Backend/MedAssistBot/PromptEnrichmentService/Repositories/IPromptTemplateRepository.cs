using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPromptTemplateRepository
{
    Task<PromptTemplate?> GetBySpecialtyOrDefaultAsync(string specialtyCode, CancellationToken cancellationToken);
}
