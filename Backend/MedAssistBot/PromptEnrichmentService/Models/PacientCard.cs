namespace PromptEnrichmentService.Models;

public class PacientCard
{
    public int Id { get; set; }
    public Guid PatientId { get; set; }
    public string? SpecialtyCode { get; set; }
    public string? History { get; set; }
}
