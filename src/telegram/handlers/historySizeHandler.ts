import { settings } from "../../lib/constants";
import { extractArgs, reply } from "../../lib/telegram";
import { t } from "../../lib/translate";
import { withUser } from "../../services/messageService";
import { getUserHistorySize, updateUserSettings } from "../../services/userSettingsService";
import { BotContext } from "../botContext";

export async function historySizeHandler(ctx: BotContext) {
  const minHistorySize = settings.historySize.min;
  const maxHistorySize = settings.historySize.max;

  await withUser(ctx, async user => {
    const args = extractArgs(ctx);

    if (!args?.length) {
      await reply(
        ctx,
        t(user, "currentHistorySize", {
          temperature: getUserHistorySize(user)
        })
      );

      return;
    }

    const size = parseInt(args[0]);

    if (!Number.isFinite(size) || size < minHistorySize || size > maxHistorySize) {
      await reply(
        ctx,
        t(user, "enterHistorySize", { minHistorySize, maxHistorySize })
      );

      return;
    }

    await updateUserSettings(user, { historySize: size });

    reply(ctx, t(user, "historySizeUpdated"));
  });
}
