using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class PromptTemplate
{
    public int Id { get; set; }

    [MaxLength(64)]
    public string? SpecialtyCode { get; set; }

    [MaxLength(4096)]
    public string TemplateText { get; set; } = string.Empty;

    public bool IsDefault { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
