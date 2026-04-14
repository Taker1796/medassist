using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Services;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PromptEnrichmentService.Controllers;

[ApiController]
public class Enrichment : ControllerBase
{
    private readonly PromptTemplateService _promptService;
    private readonly LlmClient _llmClient;

    public Enrichment(PromptTemplateService templateService, LlmClient llmClient)
    {
        _promptService = templateService;
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
        var enrichedData = await _promptService.BuildEnrichedText(
            request.Patient,
            request.DoctorSpecializationCode,
            request.SpecialtyCodeOverride,
            request.Messages,
            cancellationToken);
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

    [HttpPost]
    [Route("v1/enrich/stream")]
    [Produces("text/event-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task Stream([FromBody] AddPromptRequest request, CancellationToken cancellationToken)
    {
        var enrichedData = await _promptService.BuildEnrichedText(
            request.Patient,
            request.DoctorSpecializationCode,
            request.SpecialtyCodeOverride,
            request.Messages,
            cancellationToken);

        using var llmResponse = await _llmClient.SendStreamAsync(enrichedData, cancellationToken);
        if (llmResponse == null)
        {
            Response.StatusCode = StatusCodes.Status204NoContent;
            return;
        }

        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = GetContentTypeOrDefault(llmResponse.Content.Headers.ContentType);
        Response.Headers.CacheControl = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no";

        await Response.StartAsync(cancellationToken);

        await using var responseStream = await llmResponse.Content.ReadAsStreamAsync(cancellationToken);
        var buffer = new byte[4096];

        while (true)
        {
            var read = await responseStream.ReadAsync(buffer, cancellationToken);
            if (read == 0)
            {
                break;
            }

            await Response.Body.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
    }

    [HttpPost]
    [Route("v1/summary")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(GenerateSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Post([FromBody] GenerateSummaryRequest request, CancellationToken cancellationToken)
    {
        if (request.Patient.PatientId == Guid.Empty)
        {
            return BadRequest("Invalid patient");
        }

        if (request.Messages == null || request.Messages.Length == 0)
        {
            return BadRequest("Messages are required");
        }

        if (string.IsNullOrWhiteSpace(request.DoctorSpecialtyCode))
        {
            return BadRequest("DoctorSpecialtyCode is required");
        }

        var enrichedData = await _promptService.GenerateSummary(
            request.DoctorSpecialtyCode,
            request.Patient,
            request.Messages,
            cancellationToken);
        var llmResponse = await _llmClient.SendAsync(enrichedData, cancellationToken);

        if (!TryParseSummaryPayload(llmResponse, out var payload))
        {
            return StatusCode(StatusCodes.Status502BadGateway, "LLM returned invalid summary payload JSON: " + llmResponse);
        }

        var response = new GenerateSummaryResponse
        {
            ConversationId = request.ConversationId,
            RequestId = request.RequestId,
            DoctorId = request.DoctorId,
            Summary = payload.Summary,
            Patient = payload.Patient
        };

        return Ok(response);
    }

    private static bool TryParseSummaryPayload(string? llmResponse, out GenerateSummaryLlmPayload payload)
    {
        payload = new GenerateSummaryLlmPayload();

        if (string.IsNullOrWhiteSpace(llmResponse))
        {
            return false;
        }

        var jsonPayload = ExtractJsonPayload(llmResponse);
        if (string.IsNullOrWhiteSpace(jsonPayload))
        {
            return false;
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<GenerateSummaryLlmPayload>(
                jsonPayload,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
                });

            if (parsed == null ||
                string.IsNullOrWhiteSpace(parsed.Summary) ||
                parsed.Patient == null ||
                parsed.Patient.PatientId == Guid.Empty)
            {
                return false;
            }

            payload = parsed;
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string ExtractJsonPayload(string llmResponse)
    {
        var start = llmResponse.IndexOf('{');
        var end = llmResponse.LastIndexOf('}');

        if (start < 0 || end <= start)
        {
            return string.Empty;
        }

        return llmResponse[start..(end + 1)];
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

    private static string GetContentTypeOrDefault(MediaTypeHeaderValue? contentType)
    {
        return contentType?.ToString() ?? "text/event-stream";
    }
}
