namespace PromptEnrichmentService.Models;

public class PacientCard
{
    public int Id { get; set; }
    public long PatientId { get; set; }
    public string Summary { get; set; } = string.Empty;

    public int SpecialtyId { get; set; }
    public Specialty Specialty { get; set; } = null!;

    public ICollection<PacientCardDoctor> PacientCardDoctors { get; set; } = new List<PacientCardDoctor>();
}
