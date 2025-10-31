# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Kopiera csproj och restore (snabbare caching)
# När build-context är `backend` så ligger csproj i root av contexten
# (därför kopierar vi bara backend.csproj)
COPY ["backend.csproj", "./"]
# Om csproj ligger i en undermapp, justera sökvägen. I ditt repo ligger csproj i backend/
# Exempel: COPY ["./BackendProjectName/backend.csproj", "./"]
RUN dotnet restore

# Kopiera resten och publish
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Kopiera publicerade artefakter
COPY --from=build /app/publish ./

# Kör appen och bind till PORT env var (Render sätter PORT vid runtime)
# Använder shell expansion så ${PORT} läses när containern startar
CMD ["sh", "-c", "dotnet backend.dll --urls http://0.0.0.0:${PORT:-8080}"]