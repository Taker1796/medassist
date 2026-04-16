using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Services;

public class NoOpEnrichmentTraceStore : IEnrichmentTraceStore
{
    public bool IsEnabled => false;

    public IReadOnlyCollection<DevEnrichmentTraceEntry> GetAll()
    {
        return [];
    }

    public void Add(DevEnrichmentTraceEntry entry)
    {
    }

    public void Clear()
    {
    }
}
