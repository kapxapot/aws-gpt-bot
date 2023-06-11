import { settings } from "../../lib/constants";
import { parseCommandWithArgs, reply } from "../../lib/telegram";
import { getOrAddUser } from "../../services/userService";
import { getUserTemperature, updateUserSettings } from "../../services/userSettingsService";

export async function temperatureHandler(ctx: any) {
  const minTemperature = settings.temperature.min;
  const maxTemperature = settings.temperature.max;

  const badInput = `Укажите желаемую температуру через пробел в виде дробного числа от ${minTemperature} до ${maxTemperature}.`;

  const user = await getOrAddUser(ctx.from);
  const { args } = parseCommandWithArgs(ctx.update.message.text);

  if (!args.length) {
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
}
