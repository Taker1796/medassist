namespace PromptEnrichmentService.Models;

public class LlmRequest
{
    public Message[] Messages { get; set; }= Array.Empty<Message>();
    public string Model { get; set; } = "deepseek-chat";
    public int Temperature { get; set; } = 2;
    public int MaxTokens { get; set; } = 8192;
}