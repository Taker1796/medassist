using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Services;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[Route("v1/llm-configuration")]
[Produces("application/json")]
public class LlmConfigurationController : ControllerBase
{
    private readonly LlmConfigurationService _llmConfigurationService;

    public LlmConfigurationController(LlmConfigurationService llmConfigurationService)
    {
        _llmConfigurationService = llmConfigurationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(LlmConfigurationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var configuration = await _llmConfigurationService.GetAsync(cancellationToken);
        if (configuration == null)
        {
            return NotFound("LLM configuration not found");
        }

        return Ok(ToResponse(configuration));
    }

    [HttpPatch]
    [ProducesResponseType(typeof(LlmConfigurationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Patch([FromBody] LlmConfigurationUpdateRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Endpoint))
        {
            return BadRequest("Endpoint is required");
        }

        var configuration = await _llmConfigurationService.UpdateAsync(
            request.Endpoint,
            request.ApiKeyHeader,
            request.ApiKey,
            cancellationToken);

        return Ok(ToResponse(configuration));
    }

    private static LlmConfigurationResponse ToResponse(LlmConfiguration configuration)
    {
        return new LlmConfigurationResponse
        {
            Id = configuration.Id,
            Endpoint = configuration.Endpoint,
            ApiKeyHeader = configuration.ApiKeyHeader,
            ApiKey = configuration.ApiKey
        };
    }
}
