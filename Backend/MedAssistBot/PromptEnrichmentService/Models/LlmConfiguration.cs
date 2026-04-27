using System.ComponentModel.DataAnnotations;

namespace PromptEnrichmentService.Models;

public class LlmConfiguration
{
    public const int DefaultId = 1;

    [Key]
    public int Id { get; set; } = DefaultId;

    [MaxLength(500)]
    public string Endpoint { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ApiKeyHeader { get; set; } = string.Empty;

    public string ApiKey { get; set; } = string.Empty;
}
