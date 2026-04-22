using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PromptEnrichmentService.Data;
using PromptEnrichmentService.Middleware;
using PromptEnrichmentService.Repositories;
using PromptEnrichmentService.Services;

var builder = WebApplication.CreateBuilder(args);
var allowedCorsOrigins = (builder.Configuration["AllowedCorsOrigins"]
                          ?? (builder.Environment.IsDevelopment() ? string.Empty : "https://enrichpanel-p.muk.i234.me"))
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

if (builder.Environment.IsDevelopment() || allowedCorsOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            if (builder.Environment.IsDevelopment() && allowedCorsOrigins.Length == 0)
            {
                policy.AllowAnyOrigin()
                    .AllowAnyHeader()
                    .AllowAnyMethod();
                return;
            }

            policy.WithOrigins(allowedCorsOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });
}

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = null; // PascalCase
    options.JsonSerializerOptions.WriteIndented = true;       // Красивый JSON
});

builder.Services.Configure<LlmOptions>(builder.Configuration.GetSection("Llm"));
builder.Services.AddHttpClient<LlmClient>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<PromptTemplateService>();
builder.Services.AddScoped<IPromptTemplateRepository, PromptTemplateRepository>();
builder.Services.AddSingleton<IEnrichmentTraceStore>(
    builder.Environment.IsDevelopment()
        ? new DevelopmentEnrichmentTraceStore()
        : new NoOpEnrichmentTraceStore());
builder.Services.AddDbContext<PromptDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Postgres");
    options.UseNpgsql(connectionString);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "Enter API Key",
        Type = SecuritySchemeType.ApiKey,
        Name = "X-Api-Key",
        In = ParameterLocation.Header
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbMigration");
    var db = scope.ServiceProvider.GetRequiredService<PromptDbContext>();
    await PromptTemplateDbInitializer.InitializeAsync(db, app.Environment, logger);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment() || allowedCorsOrigins.Length > 0)
{
    app.UseCors("AllowFrontend");
}

//app.UseHttpsRedirection();

app.UseMiddleware<ApiKeyMiddleware>();
app.MapControllers();

app.Run();
