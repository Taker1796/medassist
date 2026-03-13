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

    public async Task<EnrichedData> BuildEnrichedText(Guid? patientId, string specialtyCode, Message[] messages, CancellationToken cancellationToken)
    {
        var template = string.IsNullOrWhiteSpace(specialtyCode)
            ? await _promptTemplateRepository.GetDefaultAsync(cancellationToken)
            : await _promptTemplateRepository.GetByCodeAsync(specialtyCode, cancellationToken);

        if (template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            throw new TemplateNotFoundException(specialtyCode);
        }

        if (!patientId.HasValue || patientId.Value == Guid.Empty)
        {
            return await BuildEnrichedMessages(template.Text, messages, cancellationToken: cancellationToken);
        }

        var patientCard = await _patientCardRepository.GetByPatientIdAndSpecialtyAsync(patientId.Value, specialtyCode, cancellationToken);
        if (patientCard == null)
        {
            return await BuildEnrichedMessages(template.Text, messages, cancellationToken: cancellationToken);
        }

        return await BuildEnrichedMessages(template.Text, messages, patientCard.History, cancellationToken);
    }

    private async Task<EnrichedData> BuildEnrichedMessages(
        string systemPrompt,
        Message[] messages,
        string? patientHistory = null,
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

        systemPrompt = systemPrompt.Replace(Placeholders.PatientHistory, !string.IsNullOrWhiteSpace(patientHistory) ? patientHistory : string.Empty);

        var systemMessage = new Message()
        {
            Content = systemPrompt,
            Role = LlmRoles.System,
        };
        
        var enrichedMessages = new EnrichedData()
        {
            Messages = new[] { systemMessage }.Concat(messages).ToArray()
        };
        
        return enrichedMessages;
    }
}
