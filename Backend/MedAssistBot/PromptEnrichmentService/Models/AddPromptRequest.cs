namespace PromptEnrichmentService.Models;

public class AddPromptRequest
{
    public AddPromptPatientRequest? Patient { get; set; }

    public string DoctorSpecializationCode { get; set; } = string.Empty;

    public string? SpecialtyCodeOverride { get; set; }

    public Message[] Messages { get; set; } = [];

}

public class AddPromptPatientRequest
{
    public Guid PatientId { get; set; }

    public PatientSex? Sex { get; set; }

    public int? AgeYears { get; set; }

    public string? Nickname { get; set; }

    public string? Allergies { get; set; }

    public string? ChronicConditions { get; set; }

    public string? Tags { get; set; }

    public int? Status { get; set; }

    public string? Notes { get; set; }
}

public class Message
{
    public string Role { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty;
}
