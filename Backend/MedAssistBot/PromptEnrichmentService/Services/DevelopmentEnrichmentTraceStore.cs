using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Services;

public class DevelopmentEnrichmentTraceStore : IEnrichmentTraceStore
{
    private const int MaxEntries = 200;
    private readonly LinkedList<DevEnrichmentTraceEntry> _entries = [];
    private readonly Lock _lock = new();

    public bool IsEnabled => true;

    public IReadOnlyCollection<DevEnrichmentTraceEntry> GetAll()
    {
        lock (_lock)
        {
            return _entries.ToList();
        }
    }

    public void Add(DevEnrichmentTraceEntry entry)
    {
        lock (_lock)
        {
            _entries.AddFirst(entry);

            while (_entries.Count > MaxEntries)
            {
                _entries.RemoveLast();
            }
        }
    }

    public void Clear()
    {
        lock (_lock)
        {
            _entries.Clear();
        }
    }
}
