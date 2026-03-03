using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PromptEnrichmentService.Data;
using PromptEnrichmentService.Middleware;
using PromptEnrichmentService.Repositories;
using PromptEnrichmentService.Services;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.AllowAnyOrigin()
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
builder.Services.AddScoped<IPatientCardRepository, PatientCardRepository>();
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

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbMigration");
        var db = scope.ServiceProvider.GetRequiredService<PromptDbContext>();
        var pending = (await db.Database.GetPendingMigrationsAsync()).ToArray();
        logger.LogInformation("EF pending migrations: {Migrations}", pending.Length == 0 ? "(none)" : string.Join(", ", pending));
        await db.Database.MigrateAsync();
    }

    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("AllowFrontend");
}

//app.UseHttpsRedirection();

app.UseMiddleware<ApiKeyMiddleware>();
app.MapControllers();

app.Run();
