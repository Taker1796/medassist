using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;
using PromptEnrichmentService.Services;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[Route("v1/prompt-templates")]
[Produces("application/json")]
public class PromptTemplateController : ControllerBase
{
    private readonly IPromptTemplateRepository _promptTemplateRepository;
    private readonly IMemoryCache _memoryCache;

    public PromptTemplateController(IPromptTemplateRepository promptTemplateRepository, IMemoryCache memoryCache)
    {
        _promptTemplateRepository = promptTemplateRepository;
        _memoryCache = memoryCache;
    }

    [HttpGet("resolve")]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResolved([FromQuery] string? code, CancellationToken cancellationToken)
    {
        var template = string.IsNullOrWhiteSpace(code)
            ? await _promptTemplateRepository.GetDefaultAsync(cancellationToken)
            : await _promptTemplateRepository.GetByCodeAsync(code, cancellationToken);
        if (template == null)
        {
            return NotFound("Шаблон не найден");
        }

        _memoryCache.Remove(PromptTemplateService.TemplateCacheKey);
        return Ok(ToResponse(template));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PromptTemplateResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var templates = await _promptTemplateRepository.GetAllAsync(cancellationToken);
        return Ok(templates.Select(ToResponse));
    }

    [HttpPatch("text")]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateText([FromBody] PromptTemplateUpsertRequest request, CancellationToken cancellationToken)
    {
        var template = await _promptTemplateRepository.UpdateTextAsync(
            request.Code,
            request.Text,
            cancellationToken);

        if (template == null)
        {
            return NotFound("Шаблон не найден");
        }

        return Ok(ToResponse(template));
    }

    [HttpDelete("{code}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] string code, CancellationToken cancellationToken)
    {
        var deleted = await _promptTemplateRepository.DeleteAsync(code, cancellationToken);
        if (!deleted)
        {
            return NotFound($"Шаблон с Code={code} не найден");
        }

        _memoryCache.Remove(PromptTemplateService.TemplateCacheKey);
        return NoContent();
    }

    private static PromptTemplateResponse ToResponse(PromptEnrichmentService.Models.PromptTemplate template)
    {
        return new PromptTemplateResponse
        {
            Code = template.Code,
            Name = template.Name,
            Text = template.Text
        };
    }
}
