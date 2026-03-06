using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PromptEnrichmentService.Models;

public class PatientCardUpsertRequest
{
    public Guid PatientId { get; set; }

    [MaxLength(64)]
    public string? SpecialtyCode { get; set; }

    public PatientCardHistoryRequest? History { get; set; }
}

public class PatientCardHistoryRequest
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
