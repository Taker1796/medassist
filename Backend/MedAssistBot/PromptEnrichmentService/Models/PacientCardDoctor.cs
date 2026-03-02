namespace PromptEnrichmentService.Models;

public class PacientCardDoctor
{
    public int PacientCardId { get; set; }
    public PacientCard PacientCard { get; set; } = null!;

    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = null!;
}
