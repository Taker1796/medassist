using System.Net.Http.Json;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Constants;

namespace PromptEnrichmentService.Services;

public class LlmClient
{
    private readonly HttpClient _httpClient;
    private readonly LlmConfigurationService _llmConfigurationService;

    public LlmClient(HttpClient httpClient, LlmConfigurationService llmConfigurationService)
    {
        _httpClient = httpClient;
        _llmConfigurationService = llmConfigurationService;
    }

    public async Task<string?> SendAsync(EnrichedData enrichedData, CancellationToken cancellationToken)
    {
        var configuration = await _llmConfigurationService.GetAsync(cancellationToken);
        if (configuration == null || string.IsNullOrWhiteSpace(configuration.Endpoint))
        {
            return null;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, configuration.Endpoint)
        {
            Content = JsonContent.Create(BuildRequest(enrichedData))
        };

        if (!string.IsNullOrWhiteSpace(configuration.ApiKey) && !string.IsNullOrWhiteSpace(configuration.ApiKeyHeader))
        {
            request.Headers.TryAddWithoutValidation(configuration.ApiKeyHeader, configuration.ApiKey);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<LlmResponse>(cancellationToken: cancellationToken);
        return payload?.Content;
    }

    public async Task<HttpResponseMessage?> SendStreamAsync(EnrichedData enrichedData, CancellationToken cancellationToken)
    {
        var configuration = await _llmConfigurationService.GetAsync(cancellationToken);
        if (configuration == null || string.IsNullOrWhiteSpace(configuration.Endpoint))
        {
            return null;
        }

        var request = new HttpRequestMessage(HttpMethod.Post, GetStreamEndpoint(configuration.Endpoint))
        {
            Content = JsonContent.Create(BuildRequest(enrichedData, stream: true))
        };

        if (!string.IsNullOrWhiteSpace(configuration.ApiKey) && !string.IsNullOrWhiteSpace(configuration.ApiKeyHeader))
        {
            request.Headers.TryAddWithoutValidation(configuration.ApiKeyHeader, configuration.ApiKey);
        }

        var response = await _httpClient.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        response.EnsureSuccessStatusCode();
        return response;
    }

    public LlmRequest CreateRequestPayload(EnrichedData enrichedData, bool stream = false)
    {
        return BuildRequest(enrichedData, stream);
    }

    public async Task<string?> GetResolvedEndpointAsync(bool stream, CancellationToken cancellationToken)
    {
        var configuration = await _llmConfigurationService.GetAsync(cancellationToken);
        if (configuration == null || string.IsNullOrWhiteSpace(configuration.Endpoint))
        {
            return null;
        }

        return stream ? GetStreamEndpoint(configuration.Endpoint) : configuration.Endpoint;
    }

    private static string GetStreamEndpoint(string endpoint)
    {
        const string streamSuffix = "/stream";

        return endpoint.EndsWith(streamSuffix, StringComparison.OrdinalIgnoreCase)
            ? endpoint
            : endpoint.TrimEnd('/') + streamSuffix;
    }

    private static LlmRequest BuildRequest(EnrichedData enrichedData, bool stream = false)
    {
        return new LlmRequest
        {
            Messages = enrichedData.Messages,
            MaxTokens = ResolveMaxTokens(enrichedData.Messages),
            Stream = stream
        };
    }

    private static int ResolveMaxTokens(Message[] messages)
    {
        var userContent = messages
            .Where(m => string.Equals(m.Role, LlmRoles.User, StringComparison.OrdinalIgnoreCase))
            .Select(m => m.Content?.Trim() ?? string.Empty)
            .Where(content => !string.IsNullOrWhiteSpace(content))
            .ToArray();

        var relevantContent = userContent.Length == 0
            ? messages.Select(m => m.Content?.Trim() ?? string.Empty)
            : userContent;

        var totalChars = relevantContent.Sum(content => content.Length);
        var totalWords = relevantContent.Sum(CountWords);

        if (totalWords <= 5)
        {
            return 500;
        }

        if (totalWords <= 10)
        {
            return 1000;
        }

        if (totalWords <= 20)
        {
            return 2000;
        }

        return 8192;
    }

    private static int CountWords(string content)
    {
        return content
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Length;
    }
}
