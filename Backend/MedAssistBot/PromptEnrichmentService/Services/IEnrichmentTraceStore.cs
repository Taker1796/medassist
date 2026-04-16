using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Services;

public interface IEnrichmentTraceStore
{
    bool IsEnabled { get; }
    IReadOnlyCollection<DevEnrichmentTraceEntry> GetAll();
    void Add(DevEnrichmentTraceEntry entry);
    void Clear();
}
