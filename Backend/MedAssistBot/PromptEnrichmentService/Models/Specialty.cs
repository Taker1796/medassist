using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class Specialty
{
    public int Id { get; set; }

    [Required]
    [MaxLength(64)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? Name { get; set; }

    public ICollection<PromptTemplate> PromptTemplates { get; set; } = new List<PromptTemplate>();
}
