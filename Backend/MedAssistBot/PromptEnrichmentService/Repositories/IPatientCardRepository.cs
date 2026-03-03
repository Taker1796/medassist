using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPatientCardRepository
{
    Task<PacientCard?> GetByPatientIdAndSpecialtyAsync(long patientId, string specialtyCode, CancellationToken cancellationToken);
    Task<PacientCard> CreateAsync(long patientId, string specialtyCode, string summary, CancellationToken cancellationToken);
    Task<PacientCard?> UpdateSummaryAsync(long patientId, string specialtyCode, string summary, CancellationToken cancellationToken);
    Task<int> DeleteByPatientIdAsync(long patientId, CancellationToken cancellationToken);
}
