using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPatientCardRepository
{
    Task<IReadOnlyList<PacientCard>> GetAllAsync(CancellationToken cancellationToken);
    Task<PacientCard?> GetByPatientIdAndSpecialtyAsync(Guid patientId, string? specialtyCode, CancellationToken cancellationToken);
    Task<PacientCard> CreateAsync(Guid patientId, string? specialtyCode, string? history, CancellationToken cancellationToken);
    Task<PacientCard?> UpdateHistoryAsync(Guid patientId, string? specialtyCode, string? history, CancellationToken cancellationToken);
    Task<int> DeleteByPatientIdAsync(Guid patientId, CancellationToken cancellationToken);
}
