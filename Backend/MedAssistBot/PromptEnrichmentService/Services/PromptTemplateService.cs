using PromptEnrichmentService.Constants;
using PromptEnrichmentService.Exceptions;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PromptEnrichmentService.Services;

public class PromptTemplateService
{
    private static readonly JsonSerializerOptions PatientJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly IPromptTemplateRepository _promptTemplateRepository;

    public PromptTemplateService(IPromptTemplateRepository promptTemplateRepository)
    {
        _promptTemplateRepository = promptTemplateRepository;
    }

    public async Task<EnrichedData> BuildEnrichedText(GenerateSummaryPatientRequest? patient, string specialtyCode, Message[] messages, CancellationToken cancellationToken)
    {
        var template = await GetPromptTemplate(specialtyCode, cancellationToken);
        var patientJson = patient == null
            ? string.Empty
            : JsonSerializer.Serialize(patient, PatientJsonOptions);

        return BuildEnrichedMessages(
            template.Text,
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

        var summaryTemplateCode = TemplateCodes.ToSummaryCode(specialtyCode);
        var template = await _promptTemplateRepository.GetByCodeAsync(summaryTemplateCode, cancellationToken);
        if (template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            template = await GetDefaultPromptTemplate(TemplateCodes.ToSummaryCode(TemplateCodes.Default), cancellationToken);
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

    private async Task<PromptTemplate> GetPromptTemplate(string specialtyCode, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(specialtyCode))
        {
            return await GetDefaultPromptTemplate(cancellationToken);
        }
        
        var template = await _promptTemplateRepository.GetByCodeAsync(specialtyCode, cancellationToken);
        if (template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            return await GetDefaultPromptTemplate(TemplateCodes.Default, cancellationToken);
        }
        
        return template;
    }

    private async Task<PromptTemplate> GetDefaultPromptTemplate(CancellationToken cancellationToken)
    {
        return await GetDefaultPromptTemplate(TemplateCodes.Default, cancellationToken);
    }

    private async Task<PromptTemplate> GetDefaultPromptTemplate(string fallbackCode, CancellationToken cancellationToken)
    {
        var template = await _promptTemplateRepository.GetByCodeAsync(fallbackCode, cancellationToken);
        if (template == null || string.IsNullOrWhiteSpace(template.Text))
        {
            throw new TemplateNotFoundException($"default prompt template not found for code '{fallbackCode}'");
        }
            
        return template;
    }
}
