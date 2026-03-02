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

    public async Task<PacientCard> CreateAsync(
        long doctorId,
        long patientId,
        string specialtyCode,
        string summary,
        CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCode(specialtyCode);
        var normalizedSummary = summary.Trim();

        var doctor = await GetOrCreateDoctorAsync(doctorId, cancellationToken);
        var specialty = await GetOrCreateSpecialtyAsync(normalizedSpecialtyCode, cancellationToken);

        var pacientCard = new PacientCard
        {
            PatientId = patientId,
            Specialty = specialty,
            Summary = normalizedSummary
        };

        _dbContext.PacientCards.Add(pacientCard);
        await _dbContext.SaveChangesAsync(cancellationToken);

        _dbContext.PacientCardDoctors.Add(new PacientCardDoctor
        {
            PacientCardId = pacientCard.Id,
            DoctorId = doctor.Id
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await _dbContext.PacientCards
            .Include(p => p.Specialty)
            .Include(p => p.PacientCardDoctors)
            .ThenInclude(pd => pd.Doctor)
            .FirstAsync(p => p.Id == pacientCard.Id, cancellationToken);
    }

    public async Task<PacientCard?> UpdateSummaryAsync(
        long doctorId,
        long patientId,
        string specialtyCode,
        string summary,
        CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCode(specialtyCode);
        var normalizedSummary = summary.Trim();

        var pacientCard = await _dbContext.PacientCards
            .Include(p => p.Specialty)
            .Include(p => p.PacientCardDoctors)
            .ThenInclude(pd => pd.Doctor)
            .FirstOrDefaultAsync(
                p => p.PatientId == patientId
                     && p.Specialty.Code == normalizedSpecialtyCode
                     && p.PacientCardDoctors.Any(pd => pd.Doctor.DocorId == doctorId),
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

    private async Task<Doctor> GetOrCreateDoctorAsync(long doctorId, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.Doctors
            .FirstOrDefaultAsync(d => d.DocorId == doctorId, cancellationToken);

        if (existing != null)
        {
            return existing;
        }

        var doctor = new Doctor
        {
            DocorId = doctorId
        };

        _dbContext.Doctors.Add(doctor);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return doctor;
    }

    private async Task<Specialty> GetOrCreateSpecialtyAsync(string specialtyCode, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.Specialties
            .FirstOrDefaultAsync(s => s.Code == specialtyCode, cancellationToken);

        if (existing != null)
        {
            return existing;
        }

        var specialty = new Specialty
        {
            Code = specialtyCode
        };

        _dbContext.Specialties.Add(specialty);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return specialty;
    }

    private static string NormalizeSpecialtyCode(string specialtyCode)
    {
        if (string.IsNullOrWhiteSpace(specialtyCode))
        {
            throw new ArgumentException("SpecialtyCode обязателен", nameof(specialtyCode));
        }

        return specialtyCode.Trim();
    }
}
