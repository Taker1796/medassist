namespace PromptEnrichmentService.Constants;

public static class TemplateCodes
{
    public const string SummaryPrefix = "sum_";
    public const string Default = "default";
    public const string Cardiology = "cardiology";
    public const string Neurology = "neurology";
    public const string Pediatrics = "pediatrics";
    public const string Dermatology = "dermatology";
    public const string Therapy = "therapy";
    public const string Psychiatry = "psychiatry";
    public const string Gynecology = "gynecology";

    public static string ToSummaryCode(string? specialtyCode)
    {
        var normalized = string.IsNullOrWhiteSpace(specialtyCode) ? Default : specialtyCode.Trim();
        return $"{SummaryPrefix}{normalized}";
    }
}
