namespace PromptEnrichmentService.Exceptions;

public class TemplateNotFoundException : Exception
{
    public string? SpecialtyCode { get; }

    public TemplateNotFoundException(string? specialtyCode)
        : base(BuildMessage(specialtyCode))
    {
        SpecialtyCode = specialtyCode;
    }

    public TemplateNotFoundException(string? specialtyCode, Exception innerException)
        : base(BuildMessage(specialtyCode), innerException)
    {
        SpecialtyCode = specialtyCode;
    }

    private static string BuildMessage(string? specialtyCode)
    {
        return string.IsNullOrWhiteSpace(specialtyCode)
            ? "Prompt template not found."
            : $"Prompt template not found for specialtyCode '{specialtyCode}'.";
    }
}
