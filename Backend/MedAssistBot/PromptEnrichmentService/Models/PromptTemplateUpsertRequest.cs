using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class PromptTemplateUpsertRequest
{
    [MaxLength(64)]
    public string? Code { get; set; }

    public string? Text { get; set; }
}
