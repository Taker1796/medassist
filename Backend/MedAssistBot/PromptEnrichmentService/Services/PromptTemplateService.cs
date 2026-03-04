using PromptEnrichmentService.Constants;
using PromptEnrichmentService.Exceptions;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;
using Microsoft.Extensions.Caching.Memory;

namespace PromptEnrichmentService.Services;

public class PromptTemplateService
{
    private readonly IPromptTemplateRepository _promptTemplateRepository;
    private readonly IPatientCardRepository _patientCardRepository;
    private readonly IMemoryCache _memoryCache;

    public PromptTemplateService(
        IPromptTemplateRepository promptTemplateRepository,
        IPatientCardRepository patientCardRepository,
        IMemoryCache memoryCache)
    {
        _promptTemplateRepository = promptTemplateRepository;
        _patientCardRepository = patientCardRepository;
        _memoryCache = memoryCache;
    }

    public async Task<EnrichedData> BuildEnrichedText(Guid patientId, string specialtyCode, Message[] messages, CancellationToken cancellationToken)
    {
        var template = string.IsNullOrWhiteSpace(specialtyCode)
            ? await _promptTemplateRepository.GetDefaultAsync(cancellationToken)
            : await _promptTemplateRepository.GetByCodeAsync(specialtyCode, cancellationToken);

        if (template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            throw new TemplateNotFoundException(specialtyCode);
        }

        if (patientId == Guid.Empty)
        {
            return await BuildEnrichedMessages(template.Text, messages, cancellationToken: cancellationToken);
        }
        

        var patientCard = await _patientCardRepository.GetByPatientIdAndSpecialtyAsync(patientId, specialtyCode, cancellationToken);
        if (patientCard == null)
        {
            return await BuildEnrichedMessages(template.Text, messages, cancellationToken: cancellationToken);
        }

        return await BuildEnrichedMessages(template.Text, messages, patientCard.Summary, cancellationToken);
    }

    private async Task<EnrichedData> BuildEnrichedMessages(
        string systemPrompt,
        Message[] messages,
        string? summary = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(systemPrompt))
        {
            throw new ArgumentNullException(nameof(systemPrompt));
        }

        if (messages == null || messages.Length == 0)
        {
            throw new ArgumentNullException(nameof(messages));
        }

        var systemMessage = new Message()
        {
            Content = systemPrompt,
            Role = LlmRoles.System,
        };

        var enrichedMessages = new EnrichedData()
        {
            Messages = new[] { systemMessage }.Concat(messages).ToArray()
        };

        if (string.IsNullOrWhiteSpace(summary))
        {
            return enrichedMessages;
        }

        var lastUserMessage = messages.LastOrDefault(m => string.Equals(m.Role, LlmRoles.User, StringComparison.OrdinalIgnoreCase));
        if (lastUserMessage != null)
        {
            var insertSummaryPrompt = await GetInsertSummaryPromptAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(insertSummaryPrompt))
            {
                lastUserMessage.Content = summary + ". " + lastUserMessage.Content;
            }
            else
            {
                lastUserMessage.Content = insertSummaryPrompt.Replace("{summary}", summary) + ". " + lastUserMessage.Content;
            }
        }

        return enrichedMessages;
    }

    private async Task<string?> GetInsertSummaryPromptAsync(CancellationToken cancellationToken)
    {
        if (_memoryCache.TryGetValue<string>(SystemTemplates.InsertSummary, out var cachedValue))
        {
            return cachedValue;
        }

        var template = await _promptTemplateRepository.GetByCodeAsync(SystemTemplates.InsertSummary, cancellationToken);
        if (template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            return null;
        }

        _memoryCache.Set(SystemTemplates.InsertSummary, template.Text);
        return template.Text;
    }
}
