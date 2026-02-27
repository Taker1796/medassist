namespace PromptEnrichmentService.Models;

public class PromptTemplateResponse
{
    public int Id { get; set; }
    public string? SpecialtyCode { get; set; }
    public string? SpecialtyName { get; set; }
    public string TemplateText { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
