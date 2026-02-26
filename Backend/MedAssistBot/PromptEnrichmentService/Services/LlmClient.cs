using System.Net.Http.Json;
using Microsoft.Extensions.Options;
using PromptEnrichmentService.Models;

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

    public async Task<string?> SendAsync(string enrichedText, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Endpoint))
        {
            return null;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, _options.Endpoint)
        {
            Content = JsonContent.Create(new LlmRequest
            {
                Prompt = enrichedText
            })
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
}
