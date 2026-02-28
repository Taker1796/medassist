using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class PromptTemplateUpsertRequest
{
    public int? TemplateId { get; set; }

    [MaxLength(64)]
    public string? SpecialtyCode { get; set; }

    [Required]
    [MaxLength(4096)]
    public string TemplateText { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}
