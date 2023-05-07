import { settings } from "../../lib/constants";
import { reply } from "../../lib/telegram";
import { getOrAddUser } from "../../services/userService";
import { getUserTemperature, updateUserSettings } from "../../services/userSettingsService";

export async function temperatureHandler(ctx: any) {
  const minTemperature = settings.temperature.min;
  const maxTemperature = settings.temperature.max;

  const badInput = `Укажите желаемую температуру через пробел в виде дробного числа от ${minTemperature} до ${maxTemperature}.`;

  const user = await getOrAddUser(ctx.from);
  const userSettings = user.settings ?? {};

  const text: string = ctx.update.message.text;
  const parts = text.split(' ');

  if (parts.length === 1) {
    await reply(ctx, `Текущая температура: ${getUserTemperature(user)}`);
    return;
  }

  const temp = parseFloat(parts[1].replace(",", "."));

  if (!Number.isFinite(temp) || temp < minTemperature || temp > maxTemperature) {
    await reply(ctx, badInput);
    return;
  }

  userSettings.temperature = temp;

  await updateUserSettings(user, userSettings);

  reply(ctx, "Температура успешно изменена.");
}
