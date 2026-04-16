using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Services;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[Route("v1/dev/enrichment-logs")]
[Produces("application/json")]
[ApiExplorerSettings(IgnoreApi = true)]
public class DevEnrichmentLogsController : ControllerBase
{
    private readonly IEnrichmentTraceStore _traceStore;

    public DevEnrichmentLogsController(IEnrichmentTraceStore traceStore)
    {
        _traceStore = traceStore;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult Get()
    {
        if (!_traceStore.IsEnabled)
        {
            return NotFound();
        }

        return Ok(_traceStore.GetAll());
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult Delete()
    {
        if (!_traceStore.IsEnabled)
        {
            return NotFound();
        }

        _traceStore.Clear();
        return NoContent();
    }
}
