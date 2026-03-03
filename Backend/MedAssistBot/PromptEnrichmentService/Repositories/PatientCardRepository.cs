using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Data;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public class PatientCardRepository : IPatientCardRepository
{
    private readonly PromptDbContext _dbContext;

    public PatientCardRepository(PromptDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PacientCard?> GetByPatientIdAndSpecialtyAsync(long patientId, string specialtyCode, CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCodeForLookup(specialtyCode);

        return await _dbContext.PacientCards
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.PatientId == patientId && p.SpecialtyCode == normalizedSpecialtyCode,
                cancellationToken);
    }

    public async Task<PacientCard> CreateAsync(
        long patientId,
        string specialtyCode,
        string summary,
        CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCode(specialtyCode);
        var normalizedSummary = summary.Trim();

        var pacientCard = new PacientCard
        {
            PatientId = patientId,
            SpecialtyCode = normalizedSpecialtyCode,
            Summary = normalizedSummary
        };

        _dbContext.PacientCards.Add(pacientCard);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return pacientCard;
    }

    public async Task<PacientCard?> UpdateSummaryAsync(
        long patientId,
        string specialtyCode,
        string summary,
        CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCode(specialtyCode);
        var normalizedSummary = summary.Trim();

        var pacientCard = await _dbContext.PacientCards
            .FirstOrDefaultAsync(
                p => p.PatientId == patientId && p.SpecialtyCode == normalizedSpecialtyCode,
                cancellationToken);

        if (pacientCard == null)
        {
            return null;
        }

        pacientCard.Summary = normalizedSummary;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return pacientCard;
    }

    public async Task<int> DeleteByPatientIdAsync(long patientId, CancellationToken cancellationToken)
    {
        var cards = await _dbContext.PacientCards
            .Where(p => p.PatientId == patientId)
            .ToListAsync(cancellationToken);

        if (cards.Count == 0)
        {
            return 0;
        }

        _dbContext.PacientCards.RemoveRange(cards);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return cards.Count;
    }

    private static string NormalizeSpecialtyCode(string specialtyCode)
    {
        if (string.IsNullOrWhiteSpace(specialtyCode))
        {
            throw new ArgumentException("SpecialtyCode обязателен", nameof(specialtyCode));
        }

        return specialtyCode.Trim();
    }

    private static string NormalizeSpecialtyCodeForLookup(string? specialtyCode)
    {
        return string.IsNullOrWhiteSpace(specialtyCode) ? string.Empty : specialtyCode.Trim();
    }
}
