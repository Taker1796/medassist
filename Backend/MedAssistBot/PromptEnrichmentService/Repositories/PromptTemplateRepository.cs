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

    public async Task<PromptTemplate?> GetByCodeAsync(string? code, CancellationToken cancellationToken)
    {
        var normalizedCode = Normalize(code);
        if (normalizedCode == null)
        {
            return null;
        }

        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == normalizedCode, cancellationToken);
    }

    public async Task<PromptTemplate?> GetDefaultAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IsDefault, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PromptTemplate>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .OrderByDescending(p => p.IsDefault)
            .ThenBy(p => p.Code)
            .ToListAsync(cancellationToken);
    }

    public async Task<PromptTemplate?> UpdateTextAsync(string? code, string? text, CancellationToken cancellationToken)
    {
        var normalizedText = text?.Trim() ?? string.Empty;
        var normalizedCode = Normalize(code);

        var existing = normalizedCode == null
            ? await _dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.IsDefault, cancellationToken)
            : await _dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Code == normalizedCode, cancellationToken);

        if (existing == null)
        {
            return null;
        }

        existing.Text = normalizedText;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return existing;
    }

    public async Task<bool> DeleteAsync(string code, CancellationToken cancellationToken)
    {
        var normalizedCode = Normalize(code);
        if (normalizedCode == null)
        {
            return false;
        }

        var existing = await _dbContext.PromptTemplates
            .FirstOrDefaultAsync(p => p.Code == normalizedCode, cancellationToken);

        if (existing == null)
        {
            return false;
        }

        _dbContext.PromptTemplates.Remove(existing);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
