using MedAssistBot;
using Telegram.Bot;


var builder = Host.CreateApplicationBuilder(args);
var botToken = builder.Configuration["token"];
if (string.IsNullOrWhiteSpace(botToken))
{
    Console.WriteLine("Please provide a valid bot token");
    Console.ReadLine();
    return;
}

builder.Services.AddHostedService<Worker>();
builder.Services.AddSingleton<ITelegramBotClient>(sp => new TelegramBotClient(botToken));

var host = builder.Build();
host.Run();