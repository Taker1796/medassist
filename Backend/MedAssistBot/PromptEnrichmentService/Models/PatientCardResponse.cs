namespace PromptEnrichmentService.Models;

public class PatientCardResponse
{
    public int Id { get; set; }
    public Guid PatientId { get; set; }
    public string SpecialtyCode { get; set; } = string.Empty;
    public string History { get; set; } = string.Empty;
}
