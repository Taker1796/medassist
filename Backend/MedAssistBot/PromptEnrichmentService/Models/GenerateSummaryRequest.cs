namespace PromptEnrichmentService.Models;

public class GenerateSummaryRequest
{
    public Guid ConversationId { get; set; }

    public Guid RequestId { get; set; }

    public Guid DoctorId { get; set; }

    public string DoctorSpecialtyCode { get; set; } = string.Empty;

    public GenerateSummaryPatientRequest Patient { get; set; } = new();

    public Message[] Messages { get; set; } = [];
}

public class GenerateSummaryPatientRequest
{
    public Guid PatientId { get; set; }

    public PatientSex? Sex { get; set; }

    public int AgeYears { get; set; }

    public string? Nickname { get; set; }

    public string? Allergies { get; set; }

    public string? ChronicConditions { get; set; }

    public string? Tags { get; set; }

    public int Status { get; set; }

    public string? Notes { get; set; }
}
