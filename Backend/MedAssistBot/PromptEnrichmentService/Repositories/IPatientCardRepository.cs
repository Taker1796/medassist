using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPatientCardRepository
{
    Task<IReadOnlyList<PacientCard>> GetAllAsync(CancellationToken cancellationToken);
    Task<PacientCard?> GetByPatientIdAndSpecialtyAsync(Guid patientId, string? specialtyCode, CancellationToken cancellationToken);
    Task<PacientCard> CreateAsync(Guid patientId, string? specialtyCode, string? summary, CancellationToken cancellationToken);
    Task<PacientCard?> UpdateSummaryAsync(Guid patientId, string? specialtyCode, string? summary, CancellationToken cancellationToken);
    Task<int> DeleteByPatientIdAsync(Guid patientId, CancellationToken cancellationToken);
}
