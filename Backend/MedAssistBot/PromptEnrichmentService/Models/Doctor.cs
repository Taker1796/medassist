namespace PromptEnrichmentService.Models;

public class Doctor
{
    public int Id { get; set; }
    public long DocorId { get; set; }

    public ICollection<PacientCardDoctor> PacientCardDoctors { get; set; } = new List<PacientCardDoctor>();
}
