namespace PromptEnrichmentService.Models;

public class LlmConfigurationUpdateRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKeyHeader { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}
