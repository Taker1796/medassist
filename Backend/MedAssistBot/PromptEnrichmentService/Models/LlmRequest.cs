namespace PromptEnrichmentService.Models;

public class LlmRequest
{
    public Message[] Messages { get; set; }= Array.Empty<Message>();
    public string Model { get; set; } = "deepseek-chat";
    public int Temperature { get; set; } = 0;
    public int MaxTokens { get; set; } = 8192;
    public bool Stream { get; set; } = false;
}