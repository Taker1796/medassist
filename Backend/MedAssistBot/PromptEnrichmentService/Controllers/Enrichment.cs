using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Services;

namespace PromptEnrichmentService.Controllers;

[ApiController]
public class Enrichment : ControllerBase
{
    private readonly PromptTemplateService _templateService;
    private readonly LlmClient _llmClient;

    public Enrichment(PromptTemplateService templateService, LlmClient llmClient)
    {
        _templateService = templateService;
        _llmClient = llmClient;
    }

    [HttpPost]
    [Route("v1/enrich")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(AddPromptResponse), StatusCodes.Status200OK)]  
    [ProducesResponseType(StatusCodes.Status400BadRequest)]  
    [ProducesResponseType(StatusCodes.Status401Unauthorized)] 
    public async Task<IActionResult> Post([FromBody] AddPromptRequest request, CancellationToken cancellationToken)
    {
        Guid? patientId = null;
        if (!string.IsNullOrWhiteSpace(request.PatientId) && Guid.TryParse(request.PatientId, out var parsedPatientId))
        {
            patientId = parsedPatientId;
        }

        var enrichedData = await _templateService.BuildEnrichedText(patientId, request.DoctorSpecializationCode, request.Messages, cancellationToken);
        var llmResponse = await _llmClient.SendAsync(enrichedData, cancellationToken);
        var enrichedText = FormatMessages(enrichedData.Messages);

        var response = new AddPromptResponse
        {
            EnrichedText = enrichedText,
            LlmResponse = llmResponse,
            TimeStamp = DateTime.UtcNow
        };
        
        return Ok(response);
    }

    private static string FormatMessages(Message[] messages)
    {
        if (messages == null || messages.Length == 0)
        {
            return string.Empty;
        }

        return string.Join(
            Environment.NewLine + Environment.NewLine,
            messages.Select((m, i) => $"{i + 1}. [{m.Role}]{Environment.NewLine}{m.Content}")
        );
    }
}
