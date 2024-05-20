import { settings } from "../../lib/constants";
import { extractArgs, reply } from "../../lib/telegram";
import { withUser } from "../../services/messageService";
import { getUserTemperature, updateUserSettings } from "../../services/userSettingsService";
import { BotContext } from "../botContext";

export async function temperatureHandler(ctx: BotContext) {
  const minTemperature = settings.temperature.min;
  const maxTemperature = settings.temperature.max;

  const badInput = `Укажите желаемую температуру через пробел в виде дробного числа от ${minTemperature} до ${maxTemperature}.`;

  await withUser(ctx, async user => {
    const args = extractArgs(ctx);

    if (!args?.length) {
      await reply(ctx, `Текущая температура: ${getUserTemperature(user)}`);
      return;
    }

    const temp = parseFloat(args[0].replace(",", "."));

    if (!Number.isFinite(temp) || temp < minTemperature || temp > maxTemperature) {
      await reply(ctx, badInput);
      return;
    }

    await updateUserSettings(user, { temperature: temp });

    reply(ctx, "Температура успешно изменена.");
  });
}
