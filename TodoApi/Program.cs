using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TodoApi;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ToDoDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("ToDoDB"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("ToDoDB"))));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// JWT authentication
var jwt = builder.Configuration.GetSection("Jwt");
var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = jwtKey
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// ---------- Auth ----------
var passwordHasher = new PasswordHasher<User>();

string CreateToken(User user)
{
    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username)
    };
    var token = new JwtSecurityToken(
        issuer: jwt["Issuer"],
        audience: jwt["Audience"],
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(jwt.GetValue<int>("ExpireMinutes")),
        signingCredentials: new SigningCredentials(jwtKey, SecurityAlgorithms.HmacSha256));
    return new JwtSecurityTokenHandler().WriteToken(token);
}

app.MapPost("/register", async (User newUser, ToDoDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(newUser.Username) || string.IsNullOrWhiteSpace(newUser.Password))
        return Results.BadRequest("Username and password are required");
    if (await db.Users.AnyAsync(u => u.Username == newUser.Username))
        return Results.Conflict("Username already exists");

    var user = new User { Username = newUser.Username };
    user.Password = passwordHasher.HashPassword(user, newUser.Password);
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { token = CreateToken(user) });
});

app.MapPost("/login", async (User login, ToDoDbContext db) =>
{
    var user = await db.Users.FirstOrDefaultAsync(u => u.Username == login.Username);
    if (user is null ||
        passwordHasher.VerifyHashedPassword(user, user.Password, login.Password) == PasswordVerificationResult.Failed)
        return Results.Unauthorized();
    return Results.Ok(new { token = CreateToken(user) });
});

// ---------- Items (require a valid token, each user sees only his own items) ----------

// the id of the logged-in user, taken from the token's claims
int GetUserId(ClaimsPrincipal user) =>
    int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

app.MapGet("/items", async (ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);
    var items = await db.Items.Where(i => i.UserId == userId).ToListAsync();
    return Results.Ok(items);
}).RequireAuthorization();

app.MapGet("/items/{id}", async (int id, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null)
        return Results.NotFound();
    return Results.Ok(item);
}).RequireAuthorization();

app.MapPost("/items", async (Item item, ClaimsPrincipal user, ToDoDbContext db) =>
{
    item.UserId = GetUserId(user); // owner comes from the token, not from the client
    db.Items.Add(item);
    await db.SaveChangesAsync();
    return Results.Created($"/items/{item.Id}", item);
}).RequireAuthorization();

app.MapPut("/items/{id}", async (int id, Item updatedItem, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null)
        return Results.NotFound();
    item.Name = updatedItem.Name;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapPut("/items/{id}/status", async (int id, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null)
        return Results.NotFound();
    item.IsComplete = !item.IsComplete;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapDelete("/items/{id}", async (int id, ClaimsPrincipal user, ToDoDbContext db) =>
{
    var userId = GetUserId(user);
    var item = await db.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
    if (item is null)
        return Results.NotFound();
    db.Items.Remove(item);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.Run();
