namespace PromptEnrichmentService.Models;

public class PacientCard
{
    public int Id { get; set; }
    public Guid PatientId { get; set; }
    public string SpecialtyCode { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
}
