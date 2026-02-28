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
        // Let CORS preflight pass without API key checks only in Development.
        
        /*При CORS (фронт и бэк на разных доменах) браузер сначала шлёт preflight OPTIONS.
           •
           Это проверка “можно ли потом отправить POST/GET”.
           •
           В preflight нет тела и обычно нет  X-Api-Key значения.*/
        if (_environment.IsDevelopment() && HttpMethods.IsOptions(context.Request.Method))
        {
            await _next(context);
            return;
        }

        if (_environment.IsDevelopment() && IsSwaggerRequest(context.Request.Path))
        {
            await _next(context);
            return;
        }

        if (IsAuthUI(context.Request.Path))
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

    private static bool IsAuthUI(PathString path)
    {
        return path.StartsWithSegments("/v1/auth-ui");
    }
    
    private static bool IsSwaggerRequest(PathString path)
    {
        return path.StartsWithSegments("/swagger");
    }
}
