using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class PatientCardUpsertRequest
{
    public long DoctorId { get; set; }
    public long PatientId { get; set; }

    [Required]
    [MaxLength(64)]
    public string SpecialtyCode { get; set; } = string.Empty;

    [Required]
    public string Summary { get; set; } = string.Empty;
}
