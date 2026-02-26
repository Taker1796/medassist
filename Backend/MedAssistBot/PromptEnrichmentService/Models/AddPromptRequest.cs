namespace PromptEnrichmentService.Models;

public class AddPromptRequest
{
    public string Text { get; set; } = string.Empty;
    public string? SpecialtyCode { get; set; }
}
