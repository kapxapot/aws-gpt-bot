import { settings } from "../../lib/constants";
import { extractArgs, reply } from "../../lib/telegram";
import { t } from "../../lib/translate";
import { withUser } from "../../services/messageService";
import { getUserTemperature, updateUserSettings } from "../../services/userSettingsService";
import { BotContext } from "../botContext";

export async function temperatureHandler(ctx: BotContext) {
  const minTemperature = settings.temperature.min;
  const maxTemperature = settings.temperature.max;

  await withUser(ctx, async user => {
    const args = extractArgs(ctx);

    if (!args?.length) {
      await reply(
        ctx,
        t(user, "currentTemperature", {
          temperature: getUserTemperature(user)
        })
      );

      return;
    }

    const temp = parseFloat(args[0].replace(",", "."));

    if (!Number.isFinite(temp) || temp < minTemperature || temp > maxTemperature) {
      await reply(
        ctx,
        t(user, "enterTemperature", { minTemperature, maxTemperature })
      );

      return;
    }

    await updateUserSettings(user, { temperature: temp });

    reply(ctx, t(user, "temperatureUpdated"));
  });
}
