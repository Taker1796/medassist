using Microsoft.EntityFrameworkCore;
using PromptEnrichmentService.Constants;
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

    public async Task<PromptTemplate?> GetByCodeAsync(string code, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException($"Prompt template code cannot be null or empty for get", nameof(code));
        }

        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == code, cancellationToken);
    }

    public async Task<PromptTemplate?> GetDefaultAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == TemplateCodes.Default, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PromptTemplate>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .OrderByDescending(p => p.Code == TemplateCodes.Default)
            .ThenBy(p => p.Code)
            .ToListAsync(cancellationToken);
    }

    public async Task<PromptTemplate?> UpdateTextAsync(string code, string? text, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException($"Prompt template code cannot be null or empty for update", nameof(code));
        }
        var normalizedText = text?.Trim() ?? string.Empty;
        var existing = await _dbContext.PromptTemplates.FirstOrDefaultAsync(p => p.Code == code, cancellationToken);

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
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException($"Prompt template code cannot be null or empty for delete", nameof(code));
        }

        var existing = await _dbContext.PromptTemplates
            .FirstOrDefaultAsync(p => p.Code == code, cancellationToken);

        if (existing == null)
        {
            return false;
        }

        _dbContext.PromptTemplates.Remove(existing);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}
