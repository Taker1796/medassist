namespace PromptEnrichmentService.Models;

public class AddPromptResponse
{
    public string EnrichedText { get; set; } = string.Empty;
    public string? LlmResponse { get; set; }
    public DateTime TimeStamp { get; set; }
}
