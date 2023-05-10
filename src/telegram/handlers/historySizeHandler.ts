import { settings } from "../../lib/constants";
import { reply } from "../../lib/telegram";
import { getOrAddUser } from "../../services/userService";
import { getUserHistorySize, updateUserSettings } from "../../services/userSettingsService";

export async function historySizeHandler(ctx: any) {
  const minHistorySize = settings.historySize.min;
  const maxHistorySize = settings.historySize.max;

  const badInput = `Укажите желаемый размер истории через пробел в виде целого числа от ${minHistorySize} до ${maxHistorySize}.`;

  const user = await getOrAddUser(ctx.from);

  const text: string = ctx.update.message.text;
  const parts = text.split(' ');

  if (parts.length === 1) {
    await reply(ctx, `Текущий размер истории: ${getUserHistorySize(user)}`);
    return;
  }

  const size = parseInt(parts[1]);

  if (!Number.isFinite(size) || size < minHistorySize || size > maxHistorySize) {
    await reply(ctx, badInput);
    return;
  }

  await updateUserSettings(user, { historySize: size });

  reply(ctx, "Размер истории успешно изменен.");
}
