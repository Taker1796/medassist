using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Repositories;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[Route("v1/prompt-templates")]
[Produces("application/json")]
public class PromptTemplateController : ControllerBase
{
    private readonly IPromptTemplateRepository _promptTemplateRepository;

    public PromptTemplateController(IPromptTemplateRepository promptTemplateRepository)
    {
        _promptTemplateRepository = promptTemplateRepository;
    }

    [HttpGet("resolve")]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResolved(
        [FromQuery] string? specialtyCode,
        CancellationToken cancellationToken)
    {
        var template = await _promptTemplateRepository.GetBySpecialtyOrDefaultAsync(specialtyCode, cancellationToken);
        if (template == null)
        {
            return NotFound("Шаблон не найден");
        }

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

    [HttpPost("upsert")]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(PromptTemplateResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Upsert(
        [FromBody] PromptTemplateUpsertRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TemplateText))
        {
            return BadRequest("TemplateText обязателен");
        }

        var (template, created) = await _promptTemplateRepository.UpsertAsync(
            request.TemplateId,
            request.SpecialtyCode,
            request.TemplateText.Trim(),
            request.IsDefault,
            cancellationToken);

        if (created)
        {
            return Created($"/v1/prompt-templates/{template.Id}", ToResponse(template));
        }

        return Ok(ToResponse(template));
    }

    [HttpDelete("{templateId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete([FromRoute] int templateId, CancellationToken cancellationToken)
    {
        var deleted = await _promptTemplateRepository.DeleteAsync(templateId, cancellationToken);
        if (!deleted)
        {
            return NotFound($"Шаблон с Id={templateId} не найден");
        }

        return NoContent();
    }

    private static PromptTemplateResponse ToResponse(PromptEnrichmentService.Models.PromptTemplate template)
    {
        return new PromptTemplateResponse
        {
            Id = template.Id,
            SpecialtyCode = template.Specialty?.Code,
            SpecialtyName = template.Specialty?.Name,
            TemplateText = template.TemplateText,
            IsDefault = template.IsDefault,
            CreatedAtUtc = template.CreatedAtUtc
        };
    }
}
