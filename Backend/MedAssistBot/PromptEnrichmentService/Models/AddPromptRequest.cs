namespace PromptEnrichmentService.Models;

public class AddPromptRequest
{
    public Guid PatientId { get; set; }
    
    public string DoctorSpecializationCode { get; set; } = string.Empty;

    public Message[] Messages { get; set; } = [];

}

public class Message
{
    public string Role { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty;
}