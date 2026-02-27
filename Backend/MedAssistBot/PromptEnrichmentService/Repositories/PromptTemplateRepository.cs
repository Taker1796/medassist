using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Data;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Repositories;

public class PromptTemplateRepository : IPromptTemplateRepository
{
    private readonly PromptDbContext _dbContext;

    public PromptTemplateRepository(PromptDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PromptTemplate?> GetBySpecialtyOrDefaultAsync(string? specialtyCode, CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCode(specialtyCode);

        if (normalizedSpecialtyCode != null)
        {
            var match = await _dbContext.PromptTemplates
                .Include(p => p.Specialty)
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    p => p.Specialty != null && p.Specialty.Code == normalizedSpecialtyCode,
                    cancellationToken);

            if (match != null)
            {
                return match;
            }
        }

        return await _dbContext.PromptTemplates
            .Include(p => p.Specialty)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IsDefault, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PromptTemplate>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.PromptTemplates
            .Include(p => p.Specialty)
            .AsNoTracking()
            .OrderBy(p => p.IsDefault ? 1 : 0)
            .ThenBy(p => p.Specialty != null ? p.Specialty.Code : null)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<PromptTemplate> CreateAsync(
        string? specialtyCode,
        string templateText,
        bool isDefault,
        CancellationToken cancellationToken)
    {
        var specialty = await GetOrCreateSpecialtyAsync(specialtyCode, cancellationToken);
        var template = new PromptTemplate
        {
            Specialty = specialty,
            TemplateText = templateText,
            IsDefault = isDefault,
            CreatedAtUtc = DateTime.UtcNow
        };

        _dbContext.PromptTemplates.Add(template);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return template;
    }

    public async Task<PromptTemplate?> UpdateAsync(
        int templateId,
        string? specialtyCode,
        string templateText,
        bool isDefault,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.PromptTemplates
            .Include(p => p.Specialty)
            .FirstOrDefaultAsync(p => p.Id == templateId, cancellationToken);

        if (existing == null)
        {
            return null;
        }

        existing.Specialty = await GetOrCreateSpecialtyAsync(specialtyCode, cancellationToken);
        existing.TemplateText = templateText;
        existing.IsDefault = isDefault;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteAsync(int templateId, CancellationToken cancellationToken)
    {
        var existing = await _dbContext.PromptTemplates
            .FirstOrDefaultAsync(p => p.Id == templateId, cancellationToken);

        if (existing == null)
        {
            return false;
        }

        _dbContext.PromptTemplates.Remove(existing);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<Specialty?> GetOrCreateSpecialtyAsync(string? specialtyCode, CancellationToken cancellationToken)
    {
        var normalizedSpecialtyCode = NormalizeSpecialtyCode(specialtyCode);
        if (normalizedSpecialtyCode == null)
        {
            return null;
        }

        var existing = await _dbContext.Specialties
            .FirstOrDefaultAsync(s => s.Code == normalizedSpecialtyCode, cancellationToken);

        if (existing != null)
        {
            return existing;
        }

        var specialty = new Specialty
        {
            Code = normalizedSpecialtyCode
        };

        _dbContext.Specialties.Add(specialty);
        return specialty;
    }

    private static string? NormalizeSpecialtyCode(string? specialtyCode)
    {
        return string.IsNullOrWhiteSpace(specialtyCode) ? null : specialtyCode.Trim();
    }
}
