using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class PromptTemplate
{
    [Key]
    [MaxLength(64)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string Text { get; set; } = string.Empty;

    public bool IsDefault { get; set; }
}
