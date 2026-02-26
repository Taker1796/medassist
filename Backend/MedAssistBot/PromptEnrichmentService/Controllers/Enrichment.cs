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
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest("Отсутствует текст для обогащения");
        }
        
        var enrichedText = await _templateService.BuildEnrichedText(request.Text, request.SpecialtyCode, cancellationToken);
        var llmResponse = await _llmClient.SendAsync(enrichedText, cancellationToken);

        var response = new AddPromptResponse
        {
            EnrichedText = enrichedText,
            LlmResponse = llmResponse,
            TimeStamp = DateTime.UtcNow
        };
        
        return Ok(response);
    }
}
