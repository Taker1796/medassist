using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class PatientCardUpsertRequest
{
    public long PatientId { get; set; }

    [Required]
    [MaxLength(64)]
    public string SpecialtyCode { get; set; } = string.Empty;

    public string? Summary { get; set; }
}
