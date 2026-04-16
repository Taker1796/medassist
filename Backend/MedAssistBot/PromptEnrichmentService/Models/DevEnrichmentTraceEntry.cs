namespace PromptEnrichmentService.Models;

public class DevEnrichmentTraceEntry
{
    public Guid Id { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public bool Stream { get; set; }
    public string LlmEndpoint { get; set; } = string.Empty;
    public AddPromptRequest IncomingRequest { get; set; } = new();
    public Message[] EnrichedMessages { get; set; } = [];
    public LlmRequest OutgoingLlmRequest { get; set; } = new();
}
