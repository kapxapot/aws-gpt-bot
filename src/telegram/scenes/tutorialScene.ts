import { Composer } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { commands, scenes, symbols } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { getDefaultImageSettings } from "../../services/imageService";
import { gptokenString } from "../../services/gptokenService";
import { getGptokenUsagePoints } from "../../services/modelUsageService";
import { formatWordNumber } from "../../services/grammarService";
import { getModelName, gptPremiumModelName } from "../../services/modelService";

const imageSettings = getDefaultImageSettings();
const usagePoints = getGptokenUsagePoints(imageSettings);

const config = {
  fanClub: process.env.SUPPORT_GROUP!
};

const gptDefaultModelName = getModelName("gpt-default");

const steps = [
  // step 1
  `<b>В чем суть ChatGPT?</b>

ChatGPT — это компьютерная нейронная сеть, способная понимать текст, поддерживать диалог и помогать пользователям в различных задачах по работе с информацией.

ChatGPT не просто копирует данные из интернета, а имитирует мышление. Алгоритм анализирует информацию и структурирует ответ, чтобы он был удобен для чтения и соответствовал вопросу.`,
  // step 2
  `<b>Особенности ChatGPT</b>

📌 Не поисковая система.
Алгоритм обучался на базе данных до определенного момента в прошлом и не предоставит вам актуальную информацию о самых последних событиях. Следует отметить, что ChatGPT все больше догоняет время и отстает от сегодняшнего дня уже совсем немного.

📌 Не всегда говорит правду.
Алгоритм может ошибаться, если ему была предоставлена неточная или недостаточная информация.

📌 Требует проверки результата.
Алгоритм может выдавать неправильный ответ из-за нечеткой формулировки вопроса или неправильного понимания контекста.

❗️ Поэтому важно научиться правильно формулировать задания для бота.
И тогда он станет для вас полезным помощником в тех задачах, которые вы решаете.`,
  // step 3
  `<b>Правила работы с ботом</b>

1. Задавайте боту роль.

Например:
🔹 «Я хочу, чтобы ты выступил в роли маркетолога».
🔹 «Отвечай, как персонаж (имя персонажа) из фильма (название фильма)».

В режимах бота есть несколько предустановленных ролей, а также вы можете использовать режим «Свой промт» для настройки дополнительной роли.

2. Уточняйте.

Чем больше деталей, тем более актуальным и персонализированным будет ответ.

3. Ограничивайте.

Например:
🔹 «Предложи 3 варианта решения задачи».
🔹 «Используй для каждого варианта не более 10 слов».`,

  // step 3.1
  `4. Задавайте структуру, в которой хотите видеть ответ.

Например:
🔹 «Сделай пошаговый алгоритм и разбей задачи на этапы с подзадачами».

5. Задавайте пример/стиль общения.

Например:
🔹 «Перепиши этот текст в таком же стиле как и следующее сообщение».
🔹 «Напиши ответ в стиле письма: формальный / неформальный / технический / разговорный / юмористический».`,

  // step 4
  `<b>Режимы работы бота</b>

В боте предусмотрены несколько режимов работы с ChatGPT:

1. <b>Свободный диалог</b> — написание запросов и получение ответов. При этом ChatGPT запоминает историю последних сообщений. Это универсальный режим, который подходит для общения на свободные темы.

Например:
🔹 «Прочитай и перескажи в 3 предложениях суть следующего текста».
🔹 «Расскажи как научиться расставлять приоритеты».
🔹 «Придумай 10 вариантов названия для компании, занимающейся изготовлением детских игрушек из дерева».`,

  // step 4.1
  `2. <b>Роль</b> — общение с ботом в одной из предустановленных ролей, таких как Коуч, Психолог и Генератор идей. В рамках каждой роли история также сохраняется, и при возвращении к диалогу вы продолжите с того же места, где остановились.

3. <b>Свой промт</b> — инструкция, которую ChatGPT будет удерживать в памяти и учитывать при ответах все время, пока вы будете с ним общаться. Режим «Роль» также работает на аналогичных инструкциях, которые уже «зашиты» в <b>GPToid</b>.

Например:
🔹 «Веди себя как учитель английского языка. Я буду писать предложения, а ты исправляй ошибки и говори что можно добавить. Отвечай на русском».

(Такая встроенная роль у меня тоже есть!)`,

  // step 5
  `<b>Тарифные планы и пакеты услуг</b>

Всем пользователям по умолчанию доступен тариф <b>«Бесплатный»</b> с определенными ограничениями на количество запросов. В нем у вас есть доступ к <b>${gptDefaultModelName}</b>, а также возможность попробовать генерацию картинок с помощью <b>DALL-E</b>.

Если вам необходимо большее количество запросов к <b>${gptDefaultModelName}</b> или доступ к <b>${gptPremiumModelName}</b> и <b>DALL-E</b> — приобретите один из пакетов услуг (пункт меню «Пакеты услуг» /${commands.premium}).`,

  // step 6
  `<b>Гптокены, ${gptPremiumModelName} и DALL-E</b>

Модель <b>${gptPremiumModelName}</b> является более продвинутой по сравнению с <b>${gptDefaultModelName}</b>, она способна обрабатывать большие запросы и выдает более качественные ответы.

Модель <b>DALL-E</b> позволяет генерировать картинки по текстовому запросу.

Обе модели доступны при покупке пакетов (/${commands.premium}) с ${symbols.gptoken} <b>гптокенами</b> — нашей специальной «валютой». На один гптокен можно написать ${formatWordNumber("запрос", 1 / usagePoints.text, "Accusative")} к <b>${gptPremiumModelName}</b> (~1000 токенов ChatGPT каждый), а на два — создать ${formatWordNumber("картинка", 2 / usagePoints.image, "Accusative")} ${imageSettings.size} в <b>DALL-E 3</b>.

То есть, пакета в ${gptokenString(100)} вам хватит на ${formatWordNumber("запрос", 100 / usagePoints.text, "Accusative")} к <b>${gptPremiumModelName}</b> или генерацию ${formatWordNumber("картинка", 100 / usagePoints.image, "Accusative")} размером ${imageSettings.size}.`,

  // step 7
  `<b>Фан-клуб GPToid</b>

Миссия <b>GPToid</b> — помочь вам в практическом освоении ChatGPT.

Бот и обучение поддержат вас в этом процессе.

Если у вас есть вопросы, идеи или вы просто хотите пообщаться, добро пожаловать в наш фан-клуб: @${config.fanClub}`,

  // step 8
`<b>Обучение завершено</b>

🔥 Ура, вы дочитали до конца! 🔥

Пробуйте взаимодействовать с ботом разными способами для решения ваших задач.

Выбирайте один из режимов /${commands.mode} или начните писать боту прямо сейчас!
👇`
];

const scene = new WizardScene<BotContext>(
  scenes.tutorial,
  ...steps.map((step, index) => makeStepHandler(step, index === 0, index === steps.length - 1)),
  backToChatHandler
);

export const tutorialScene = scene;

function makeStepHandler(text: string, first: boolean, last: boolean) {
  const stepHandler = new Composer<BotContext>();

  const nextAction = "next";
  const exitAction = "exit";

  const keyboard = inlineKeyboard(
    ["Дальше", nextAction],
    ["Закончить", exitAction]
  );

  stepHandler.action(nextAction, async (ctx) => {
    await clearInlineKeyboard(ctx);

    if (last) {
      await reply(ctx, text);
      await ctx.scene.leave();
    } else {
      await replyWithKeyboard(ctx, keyboard, text);
      ctx.wizard.next();
    }
  });

  stepHandler.action(exitAction, backToChatHandler);

  if (first) {
    stepHandler.use(async (ctx) => {
      await replyWithKeyboard(ctx, keyboard, text);
      ctx.wizard.next();
    });
  } else {
    addSceneCommandHandlers(stepHandler);

    stepHandler.use(kickHandler);
    stepHandler.use(dunnoHandler);
  }

  return stepHandler;
}
