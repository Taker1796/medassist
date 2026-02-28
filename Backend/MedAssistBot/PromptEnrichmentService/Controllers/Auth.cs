using Microsoft.AspNetCore.Mvc;
using PromptEnrichmentService.Models;

namespace PromptEnrichmentService.Controllers;

[ApiController]
[ApiExplorerSettings(IgnoreApi = true)]
public class Auth: ControllerBase
{
    private readonly string _apiKey;
    
    public Auth(IConfiguration configuration)
    {
        _apiKey = configuration["ApiKey"];
    }
    
    [HttpPost("v1/auth-ui")]
    public bool Post([FromBody] AuthUIRequest request)
    {
        if (request?.ApiKey == _apiKey)
        {
            return true;
        }

        return false;
    }
}
