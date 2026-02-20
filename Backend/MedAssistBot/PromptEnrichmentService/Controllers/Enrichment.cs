using Microsoft.AspNetCore.Mvc;

namespace PromptEnrichmentService.Controllers;

public class Enrichment : Controller
{
    // GET
    public IActionResult Index()
    {
        return View();
    }
}