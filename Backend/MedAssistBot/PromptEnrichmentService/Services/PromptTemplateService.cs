using PromptEnrichmentService.Constants;
using PromptEnrichmentService.Exceptions;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PromptEnrichmentService.Services;

public class PromptTemplateService
{
    private static readonly JsonSerializerOptions PatientJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private readonly IPromptTemplateRepository _promptTemplateRepository;
    private readonly IMemoryCache _memoryCache;
    public const string TemplateCacheKey = "prompt_templates_all";

    public PromptTemplateService(IPromptTemplateRepository promptTemplateRepository, IMemoryCache memoryCache)
    {
        _promptTemplateRepository = promptTemplateRepository;
        _memoryCache = memoryCache;
    }

    public async Task<EnrichedData> BuildEnrichedText(
        AddPromptPatientRequest? patient,
        string specialtyCode,
        string? specialtyCodeOverride,
        Message[] messages,
        CancellationToken cancellationToken)
    {
        var templates = await GetTemplatesAsync(cancellationToken);
        var template = GetPromptTemplate(templates, specialtyCode);
        var patientJson = patient == null
            ? string.Empty
            : JsonSerializer.Serialize(patient, PatientJsonOptions);
        var systemPrompt = ApplySpecializationOverrides(template.Text, templates, specialtyCode, specialtyCodeOverride);

        return BuildEnrichedMessages(
            systemPrompt,
            messages,
            Placeholders.PatientHistory,
            patientJson,
            cancellationToken);
    }

    public async Task<EnrichedData> GenerateSummary(string specialtyCode, GenerateSummaryPatientRequest patient, Message[] messages, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(specialtyCode))
        {
            throw new ArgumentException("Specialty code is required for summary generation", nameof(specialtyCode));
        }

        var templates = await GetTemplatesAsync(cancellationToken);
        var summaryTemplateCode = TemplateCodes.ToSummaryCode(specialtyCode);
        if (!templates.TryGetValue(summaryTemplateCode, out var template) || string.IsNullOrWhiteSpace(template.Text))
        {
            template = GetRequiredTemplate(templates, TemplateCodes.ToSummaryCode(TemplateCodes.Default));
        }

        var patientJson = JsonSerializer.Serialize(patient, PatientJsonOptions);
        return BuildEnrichedMessages(
            template.Text,
            messages,
            Placeholders.SummaryPatientJson,
            patientJson,
            cancellationToken);
    }

    private EnrichedData BuildEnrichedMessages(
        string systemPrompt,
        Message[] messages,
        string placeholder,
        string? value,
        CancellationToken cancellationToken = default)
    {
        systemPrompt = systemPrompt.Replace(placeholder, value ?? string.Empty);
        return BuildEnrichedMessages(systemPrompt, messages, cancellationToken: cancellationToken);
    }
    
    private EnrichedData BuildEnrichedMessages(
        string systemPrompt,
        Message[] messages,
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

        systemPrompt = systemPrompt.Replace(
            Placeholders.CurrentDate,
            DateTimeOffset.Now.ToString("yyyy-MM-dd HH:mm:ss zzz"),
            StringComparison.Ordinal);

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

    private string ApplySpecializationOverrides(
        string systemPrompt,
        IReadOnlyDictionary<string, PromptTemplate> templates,
        string specialtyCode,
        string? specialtyCodeOverride)
    {
        if (!systemPrompt.Contains(Placeholders.Specialisations, StringComparison.Ordinal))
        {
            return systemPrompt;
        }

        string replacement;
        if (!string.IsNullOrWhiteSpace(specialtyCodeOverride))
        {
            var subSpecTemplate = GetRequiredTemplate(templates, TechnicalTemplateCodes.SubSpec);
            replacement = subSpecTemplate.Text.Replace(Placeholders.SubSpec, specialtyCodeOverride.Trim(), StringComparison.Ordinal);
        }
        else
        {
            var specListTemplate = GetRequiredTemplate(templates, TechnicalTemplateCodes.SpecList);
            var specCodes = string.Join(
                ", ",
                TemplateCodes.All.Where(code => !string.Equals(code, specialtyCode, StringComparison.OrdinalIgnoreCase)));
            replacement = specListTemplate.Text.Replace(Placeholders.SpecCodes, specCodes, StringComparison.Ordinal);
        }

        return systemPrompt.Replace(Placeholders.Specialisations, replacement, StringComparison.Ordinal);
    }

    private PromptTemplate GetPromptTemplate(IReadOnlyDictionary<string, PromptTemplate> templates, string specialtyCode)
    {
        if (string.IsNullOrWhiteSpace(specialtyCode))
        {
            return GetRequiredTemplate(templates, TemplateCodes.Default);
        }

        if (!templates.TryGetValue(specialtyCode, out var template) || string.IsNullOrWhiteSpace(template.Text))
        {
            return GetRequiredTemplate(templates, TemplateCodes.Default);
        }

        return template;
    }

    private static PromptTemplate GetRequiredTemplate(IReadOnlyDictionary<string, PromptTemplate> templates, string code)
    {
        if (!templates.TryGetValue(code, out var template) || template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            throw new TemplateNotFoundException($"default prompt template not found for code '{code}'");
        }

        return template;
    }

    private Task<IReadOnlyDictionary<string, PromptTemplate>> GetTemplatesAsync(CancellationToken cancellationToken)
    {
        return _memoryCache.GetOrCreateAsync<IReadOnlyDictionary<string, PromptTemplate>>(TemplateCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);

            var templates = await _promptTemplateRepository.GetAllAsync(cancellationToken);
            return templates.ToDictionary(t => t.Code, StringComparer.OrdinalIgnoreCase) as IReadOnlyDictionary<string, PromptTemplate>;
        })!;
    }
}
