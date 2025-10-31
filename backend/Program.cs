using backend.Hubs;
using backend.Models;
using backend.Models.Interfaces;
using backend.Models.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// Load .env file for local development (if it exists)
if (File.Exists(".env"))
{
    Console.WriteLine("📁 Loading .env file...");
    foreach (var line in File.ReadAllLines(".env"))
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;
        
        var parts = line.Split('=', 2, StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0], parts[1]);
            Console.WriteLine($"✅ Set {parts[0]} = {parts[1].Substring(0, Math.Min(10, parts[1].Length))}...");
        }
    }
    
    // Rebuild configuration to include environment variables
    builder.Configuration.AddEnvironmentVariables();
}
else
{
    Console.WriteLine("❌ No .env file found");
}

// Azure AD Authentication för att få riktiga användar-ID och namn
// Add Azure AD Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));
// Add Authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => 
        policy.RequireRole("Admin"));
    options.AddPolicy("UserOrAdmin", policy => 
        policy.RequireRole("User", "Admin"));
    options.AddPolicy("AuthenticatedUser", policy => 
        policy.RequireAuthenticatedUser());
});
// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


// För att använda inMemory-databas, sätt useInMemory till true
var useInMemory = false;

if (useInMemory)
{
   builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("innoviahub"));
}
else
{
   var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
   builder.Services.AddDbContext<AppDbContext>(options =>
      options.UseMySql(
         connectionString,
         ServerVersion.AutoDetect(connectionString))
      );
}

// CORS för att tillåta frontend att anropa API
// Lokalt: localhost:4200, Vercel: din-vercel-domain.vercel.app
builder.Services.AddCors(opt => {
   opt.AddPolicy("ng", p => p
      .WithOrigins(
         "http://localhost:4200",  // Local development
         "https://innovia-hub-joel.vercel.app", // Vercel deployment
         "https://innoviahubjoel.onrender.com", // Render deployment
         "https://innoviahub.hellbergsystems.se:8004" // Production server
      )
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials()
   );
});

builder.Services.AddSignalR();

// Creates a named HttpClient for OpenAI API calls
builder.Services.AddHttpClient("OpenAIClient", client =>
{
   // Use OpenAI API root as base URL. If you override in appsettings, include the v1 root.
   var baseUrl = builder.Configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1";
   client.BaseAddress = new Uri(baseUrl);
   
   // Only set Authorization if API key exists
   var apiKey = builder.Configuration["OpenAI:ApiKey"] ?? Environment.GetEnvironmentVariable("OpenAI__ApiKey");
   
   Console.WriteLine("� OpenAI API Key Detection:");
   Console.WriteLine($"   - Configuration['OpenAI:ApiKey']: {(!string.IsNullOrEmpty(builder.Configuration["OpenAI:ApiKey"]) ? "Found" : "Missing")}");
   Console.WriteLine($"   - Environment['OpenAI__ApiKey']: {(!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("OpenAI__ApiKey")) ? "Found" : "Missing")}");
   Console.WriteLine($"   - Final key: {(string.IsNullOrEmpty(apiKey) ? "MISSING" : $"{apiKey.Substring(0, Math.Min(15, apiKey.Length))}...")}");
   
   if (!string.IsNullOrEmpty(apiKey))
   {
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
      client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
      Console.WriteLine("✅ OpenAI HttpClient configured with API key");
   }
   else
   {
      Console.WriteLine("❌ No OpenAI API key found in configuration");
   }
});

// Dependency Injection för repositories
//DI för repositories
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();

var app = builder.Build();

// Log startup information
Console.WriteLine("🚀 [STARTUP] InnoviaHub Backend Starting...");
Console.WriteLine($"🚀 [STARTUP] Environment: {app.Environment.EnvironmentName}");

// Log all OpenAI environment variables
Console.WriteLine("🔍 [STARTUP] All OpenAI Environment Variables:");
foreach (DictionaryEntry envVar in Environment.GetEnvironmentVariables())
{
    var key = envVar.Key.ToString();
    if (key.Contains("OpenAI", StringComparison.OrdinalIgnoreCase))
    {
        var value = envVar.Value?.ToString();
        Console.WriteLine($"   {key} = {(!string.IsNullOrEmpty(value) ? $"{value.Substring(0, Math.Min(10, value.Length))}..." : "EMPTY")}");
    }
}


// CORS måste aktiveras före andra middleware
app.UseCors("ng");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
   app.MapOpenApi();
}

// Authentication och Authorization middleware för Azure AD
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
// SignalR hub för realtidsuppdateringar av bokningar
app.MapHub<BookingHub>("/hubs/bookings");

app.Run();


