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

    public async Task<PromptTemplate?> GetBySpecialtyOrDefaultAsync(string specialtyCode, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(specialtyCode))
        {
            var match = await _dbContext.PromptTemplates
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.SpecialtyCode == specialtyCode, cancellationToken);

            if (match != null)
            {
                return match;
            }
        }

        return await _dbContext.PromptTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IsDefault, cancellationToken);
    }
}
