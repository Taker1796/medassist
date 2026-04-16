using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using PromptEnrichmentService.Models;
using PromptEnrichmentService.Constants;

namespace PromptEnrichmentService.Services;

public class LlmClient
{
    private readonly HttpClient _httpClient;
    private readonly LlmOptions _options;

    public LlmClient(HttpClient httpClient, IOptions<LlmOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public async Task<string?> SendAsync(EnrichedData enrichedData, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Endpoint))
        {
            return null;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
        {
            Content = JsonContent.Create(BuildRequest(enrichedData))
        };

        if (!string.IsNullOrWhiteSpace(_options.ApiKey) && !string.IsNullOrWhiteSpace(_options.ApiKeyHeader))
        {
            request.Headers.TryAddWithoutValidation(_options.ApiKeyHeader, _options.ApiKey);
        }

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<LlmResponse>(cancellationToken: cancellationToken);
        return payload?.Content;
    }

    public async Task<HttpResponseMessage?> SendStreamAsync(EnrichedData enrichedData, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Endpoint))
        {
            return null;
        }

        var request = new HttpRequestMessage(HttpMethod.Post, GetStreamEndpoint(_options.Endpoint))
        {
            Content = JsonContent.Create(BuildRequest(enrichedData, stream: true))
        };

        if (!string.IsNullOrWhiteSpace(_options.ApiKey) && !string.IsNullOrWhiteSpace(_options.ApiKeyHeader))
        {
            request.Headers.TryAddWithoutValidation(_options.ApiKeyHeader, _options.ApiKey);
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

    public string? GetResolvedEndpoint(bool stream = false)
    {
        if (string.IsNullOrWhiteSpace(_options.Endpoint))
        {
            return null;
        }

        return stream ? GetStreamEndpoint(_options.Endpoint) : _options.Endpoint;
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
