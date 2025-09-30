using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;
using System.Text;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[AllowAnonymous] // TODO: Replace with proper authorization
public class OpenAIController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public OpenAIController(IConfiguration configuration, HttpClient httpClient)
    {
        _configuration = configuration;
        _httpClient = httpClient;
    }

    [HttpPost("chat/completions")]
    public async Task<IActionResult> CreateChatCompletion([FromBody] object request)
    {
        try
        {
            var openAiApiKey = _configuration["OpenAI:ApiKey"];
            var openAiBaseUrl = _configuration["OpenAI:BaseUrl"];

            if (string.IsNullOrEmpty(openAiApiKey))
            {
                return BadRequest("OpenAI API key is not configured");
            }

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {openAiApiKey}");

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{openAiBaseUrl}/chat/completions", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                return Ok(JsonSerializer.Deserialize<object>(responseContent));
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error calling OpenAI API: {ex.Message}");
        }
    }
}