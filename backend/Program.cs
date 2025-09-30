using backend.Hubs;
using backend.Models;
using backend.Models.Interfaces;
using backend.Models.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddCors(opt => {
   opt.AddPolicy("ng", p => p
      .WithOrigins("http://localhost:4200", "https://innoviahub.hellbergsystems.se:8004")
      .AllowAnyHeader()
      .AllowAnyMethod()
      .AllowCredentials()
      // TODO: Add Vercel domain when deployed: "https://your-vercel-domain.vercel.app"
   );
});

builder.Services.AddSignalR();

// Creates a named HttpClient for OpenAI API calls
builder.Services.AddHttpClient("OpenAIClient", client =>
{
   // Safe BaseUrl with fallback
   var baseUrl = builder.Configuration["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1/responses";
   client.BaseAddress = new Uri(baseUrl);
   
   // Only set Authorization if API key exists
   var apiKey = builder.Configuration["OpenAI:ApiKey"];
   if (!string.IsNullOrEmpty(apiKey))
   {
      client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
      client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
   }
});

// Dependency Injection för repositories
//DI för repositories
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IResourceRepository, ResourceRepository>();

var app = builder.Build();


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


