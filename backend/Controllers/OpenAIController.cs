using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;
using System.Text;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Kräver inloggning för OpenAI API-anrop
public class OpenAIController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;

    public OpenAIController(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("chat/completions")]
    public async Task<IActionResult> CreateChatCompletion([FromBody] object request)
    {
        try
        {
            // Använd named HttpClient som redan har OpenAI konfiguration
            var httpClient = _httpClientFactory.CreateClient("OpenAIClient");

            var openAiApiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrEmpty(openAiApiKey))
            {
                return BadRequest("OpenAI API key is not configured");
            }

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await httpClient.PostAsync("/chat/completions", content);
            // Hantera svaret från OpenAI API
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return Ok(JsonSerializer.Deserialize<object>(responseContent));
            }
            // Hantera fel från OpenAI API
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, errorContent);
            }
        }
        // Hantera undantag
        catch (Exception ex)
        {
            return StatusCode(500, $"Error calling OpenAI API: {ex.Message}");
        }
    }
}