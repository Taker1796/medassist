namespace PromptEnrichmentService.Models;

public class LlmConfigurationResponse
{
    public int Id { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string ApiKeyHeader { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
}
