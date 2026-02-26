namespace PromptEnrichmentService.Models;

public class LlmResponse
{
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string FinishReason { get; set; } = string.Empty;
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public string RequestId { get; set; } = string.Empty;
}