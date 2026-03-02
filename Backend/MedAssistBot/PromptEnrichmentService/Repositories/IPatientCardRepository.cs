using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public interface IPatientCardRepository
{
    Task<PacientCard> CreateAsync(long doctorId, long patientId, string specialtyCode, string summary, CancellationToken cancellationToken);
    Task<PacientCard?> UpdateSummaryAsync(long doctorId, long patientId, string specialtyCode, string summary, CancellationToken cancellationToken);
    Task<int> DeleteByPatientIdAsync(long patientId, CancellationToken cancellationToken);
}
