namespace PromptEnrichmentService.Middleware;

public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string HEADER_NAME = "X-Api-Key";
    private readonly string _apiKey;
    private readonly IWebHostEnvironment _environment;

    public ApiKeyMiddleware(RequestDelegate next, IConfiguration configuration, IWebHostEnvironment environment)
    {
        if (configuration == null)
        {
            throw new ArgumentNullException(nameof(configuration));
        }
        
        _next = next;
        _apiKey = configuration["ApiKey"];
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_environment.IsDevelopment() && IsSwaggerRequest(context.Request.Path))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(HEADER_NAME, out var extractedKey))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("API Key is missing");
            return;
        }

        if (!_apiKey.Equals(extractedKey))
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsync("Unauthorized client");
            return;
        }

        await _next(context);
    }

    private static bool IsSwaggerRequest(PathString path)
    {
        return path.StartsWithSegments("/swagger");
    }
}
