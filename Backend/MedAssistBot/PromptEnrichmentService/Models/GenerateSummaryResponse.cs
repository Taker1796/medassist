namespace PromptEnrichmentService.Models;

public class GenerateSummaryResponse
{
    public Guid ConversationId { get; set; }

    public Guid RequestId { get; set; }

    public Guid DoctorId { get; set; }

    public string Summary { get; set; } = string.Empty;

    public GenerateSummaryPatientResponse Patient { get; set; } = new();
}

public class GenerateSummaryLlmPayload
{
    public string Summary { get; set; } = string.Empty;

    public GenerateSummaryPatientResponse Patient { get; set; } = new();
}

public class GenerateSummaryPatientResponse
{
    public Guid PatientId { get; set; }

    public int Sex { get; set; }

    public int AgeYears { get; set; }

    public string? Nickname { get; set; }

    public string? Allergies { get; set; }

    public string? ChronicConditions { get; set; }

    public string? Tags { get; set; }

    public int Status { get; set; }

    public string? Notes { get; set; }
}
