using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromptEnrichmentService.Models;

public class PatientCardUpsertRequest
{
    public Guid PatientId { get; set; }

    [Required]
    [MaxLength(64)]
    public string SpecialtyCode { get; set; } = string.Empty;

    public PatientCardSummaryRequest? Summary { get; set; }
}

public class PatientCardSummaryRequest
{
    [JsonPropertyName("sex")]
    public int Sex { get; set; }

    [JsonPropertyName("ageYears")]
    public int AgeYears { get; set; }

    [JsonPropertyName("allergies")]
    public string? Allergies { get; set; }

    [JsonPropertyName("chronicConditions")]
    public string? ChronicConditions { get; set; }

    [JsonPropertyName("tags")]
    public string? Tags { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}
