using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.ReplyMarkups;

namespace MedAssistBot;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly ITelegramBotClient _bot;

    public Worker(ILogger<Worker> logger, ITelegramBotClient bot)
    {
        _logger = logger;
        _bot = bot;
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            _bot.StartReceiving(
                HandleUpdateAsync,
                HandleErrorAsync,
                cancellationToken: stoppingToken
            );
            
            _logger.LogInformation("Bot started");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occured while starting the bot.");
        }
        
        return Task.CompletedTask;
    }
    
    private async Task HandleUpdateAsync(ITelegramBotClient bot, Update update, CancellationToken ct)
    {
        if (update.Message?.Text == "/start")
        {
            await bot.SendTextMessageAsync(
                update.Message.Chat.Id,
                "Открыть ассистента",
                replyMarkup: new InlineKeyboardMarkup(
                    InlineKeyboardButton.WithWebApp(
                        "Push me and then just touch me",
                        new WebAppInfo { Url = "https://taker1796.github.io/medassist" }
                    )
                )
            );
        }

        if (update.Message?.WebAppData != null)
        {
            var data = update.Message.WebAppData.Data;
            Console.WriteLine("Данные от MiniApp: " + data);
        }
    }

    private Task HandleErrorAsync(ITelegramBotClient bot, Exception ex, CancellationToken ct)
    {
        Console.WriteLine(ex);
        _logger.LogError(ex, "An error occured");
        return Task.CompletedTask;
    }
}