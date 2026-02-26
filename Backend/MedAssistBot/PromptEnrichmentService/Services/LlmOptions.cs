namespace PromptEnrichmentService.Services;

public class LlmOptions
{
    public string Endpoint { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public string? ApiKeyHeader { get; set; }
}
