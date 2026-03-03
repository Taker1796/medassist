using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Constants;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;
using PromptEnrichmentService.Services;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[Route("v1/patient-cards")]
[Produces("application/json")]
public class PatientCardsController : ControllerBase
{
    private readonly IPatientCardRepository _patientCardRepository;
    private readonly IPromptTemplateRepository _promptTemplateRepository;
    private readonly LlmClient _llmClient;

    public PatientCardsController(
        IPatientCardRepository patientCardRepository,
        IPromptTemplateRepository promptTemplateRepository,
        LlmClient llmClient)
    {
        _patientCardRepository = patientCardRepository;
        _promptTemplateRepository = promptTemplateRepository;
        _llmClient = llmClient;
    }

    [HttpPost]
    [ProducesResponseType(typeof(PatientCardResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] PatientCardUpsertRequest request, CancellationToken cancellationToken)
    {
        if (request.PatientId <= 0)
        {
            return BadRequest("PatientId должен быть больше 0");
        }
        
        var created = await _patientCardRepository.CreateAsync(
            request.PatientId,
            request.SpecialtyCode,
            request.Summary,
            cancellationToken);

        return Created($"/v1/patient-cards/{created.Id}", ToResponse(created));
    }

    [HttpPut]
    [ProducesResponseType(typeof(PatientCardResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromBody] PatientCardUpsertRequest request, CancellationToken cancellationToken)
    {
        if (request.PatientId <= 0)
        {
            return BadRequest("PatientId должен быть больше 0");
        }

        var existing = await _patientCardRepository.GetByPatientIdAndSpecialtyAsync(
            request.PatientId,
            request.SpecialtyCode,
            cancellationToken);

        if (existing == null)
        {
            return NotFound("Запись patient card не найдена по specialtyCode + patientId");
        }

        var summaryToSave = existing.Summary;
        if (!string.IsNullOrWhiteSpace(request.Summary))
        {
            var mergeTemplate = await _promptTemplateRepository.GetByCodeAsync(
                SystemTemplates.MergeSummary,
                cancellationToken);

            if (mergeTemplate != null && !string.IsNullOrWhiteSpace(mergeTemplate.Text))
            {
                var mergePrompt = mergeTemplate.Text
                    .Replace("{oldSummary}", existing.Summary)
                    .Replace("{newSummary}", request.Summary.Trim());

                var mergedByLlm = await _llmClient.MergeSummaryStubAsync(mergePrompt, cancellationToken);
                if (!string.IsNullOrWhiteSpace(mergedByLlm))
                {
                    summaryToSave = mergedByLlm.Trim();
                }
            }
            else
            {
                summaryToSave = request.Summary.Trim();
            }
        }

        var updated = await _patientCardRepository.UpdateSummaryAsync(
            request.PatientId,
            request.SpecialtyCode,
            summaryToSave,
            cancellationToken);

        if (updated == null)
        {
            return NotFound("Запись patient card не найдена по specialtyCode + patientId");
        }

        return Ok(ToResponse(updated));
    }

    [HttpDelete("{patientId:long}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteByPatientId([FromRoute] long patientId, CancellationToken cancellationToken)
    {
        if (patientId <= 0)
        {
            return BadRequest("PatientId должен быть больше 0");
        }

        var deleted = await _patientCardRepository.DeleteByPatientIdAsync(patientId, cancellationToken);
        if (deleted == 0)
        {
            return NotFound($"Записи patient cards для patientId={patientId} не найдены");
        }

        return NoContent();
    }

    private static PatientCardResponse ToResponse(PacientCard patientCard)
    {
        return new PatientCardResponse
        {
            Id = patientCard.Id,
            PatientId = patientCard.PatientId,
            SpecialtyCode = patientCard.SpecialtyCode,
            Summary = patientCard.Summary
        };
    }
}
