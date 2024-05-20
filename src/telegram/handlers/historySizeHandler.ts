import { settings } from "../../lib/constants";
import { extractArgs, reply } from "../../lib/telegram";
import { withUser } from "../../services/messageService";
import { getUserHistorySize, updateUserSettings } from "../../services/userSettingsService";
import { BotContext } from "../botContext";

export async function historySizeHandler(ctx: BotContext) {
  const minHistorySize = settings.historySize.min;
  const maxHistorySize = settings.historySize.max;

  const badInput = `Укажите желаемый размер истории через пробел в виде целого числа от ${minHistorySize} до ${maxHistorySize}.`;

  await withUser(ctx, async user => {
    const args = extractArgs(ctx);

    if (!args?.length) {
      await reply(ctx, `Текущий размер истории: ${getUserHistorySize(user)}`);
      return;
    }

    const size = parseInt(args[0]);

    if (!Number.isFinite(size) || size < minHistorySize || size > maxHistorySize) {
      await reply(ctx, badInput);
      return;
    }

    await updateUserSettings(user, { historySize: size });

    reply(ctx, "Размер истории успешно изменен.");
  });
}
