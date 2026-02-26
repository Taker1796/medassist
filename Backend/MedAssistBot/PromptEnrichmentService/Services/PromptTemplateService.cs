using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;

namespace PromptEnrichmentService.Services;

public class PromptTemplateService
{
    private readonly IPromptTemplateRepository _promptTemplateRepository;

    public PromptTemplateService(IPromptTemplateRepository promptTemplateRepository)
    {
        _promptTemplateRepository = promptTemplateRepository;
    }
    
    public async Task<string> BuildEnrichedText(string question, string specialtyCode, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(question))
        {
            throw new ArgumentException("Question cannot be null or empty", nameof(question));
        }
        
        var template = await _promptTemplateRepository.GetBySpecialtyOrDefaultAsync(specialtyCode, cancellationToken);
        if (template == null || string.IsNullOrWhiteSpace(template.TemplateText))
        {
            return question;
        }

        return template.TemplateText.Replace("{question}", question);
    }
}
