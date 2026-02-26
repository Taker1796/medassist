namespace PromptEnrichmentService.Models;

public class LlmRequest
{
    public string Prompt { get; set; } = string.Empty;
    public string Model { get; set; } = "deepseek-chat";
    public string SystemPrompt { get; set; } = string.Empty;
    public int Temperature { get; set; } = 2;
    public int MaxTokens { get; set; } = 8192;
}