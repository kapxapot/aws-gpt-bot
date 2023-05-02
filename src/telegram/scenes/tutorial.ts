import { Composer } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { BotContext } from "../context";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { commands, messages, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, dunnoHandler, kickHandler } from "../handlers";

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

  stepHandler.action(exitAction, async (ctx) => {
    await clearInlineKeyboard(ctx);
    await reply(ctx, messages.backToAI)
    await ctx.scene.leave();
  });

  if (first) {
    stepHandler.use(async (ctx) => {
      await replyWithKeyboard(ctx, keyboard, text);
      ctx.wizard.next();
    });
  } else {
    addOtherCommandHandlers(stepHandler, commands.tutorial);

    stepHandler.use(async (ctx) => {
      await kickHandler(ctx);
      await dunnoHandler(ctx);
    });
  }

  return stepHandler;
}

const steps = [
`1. В чем суть ChatGPT?

ChatGPT - это компьютерная нейронная сеть способная понимать текст, поддерживать диалог и выполнять задания.

ChatGPT революционно меняет жизнь людей, давая возможность быстрее учиться, легче находить решения задач и автоматизировать рутинные процессы.

ChatGPT не просто копирует информацию из интернета, а имитирует мышление. Алгоритм анализирует информацию и структурирует ответ, чтобы он был удобен для чтения и соответствовал вопросу.`,
`2. Недостатки ChatGPT

Не поисковая система.
Алгоритм обучался на базе данных до 2021 года и не предоставит вам актуальную информацию на самые последние события.

Не всегда говорит правду.
Алгоритм может ошибаться, если ему была предоставлена неточная или недостаточная информация.

Требует проверки результата.
Алгоритм может выдавать неправильный ответ из-за нечеткой формулировки вопроса или неправильного понимания контекста.

Поэтому важно научиться правильно формулировать задания для бота. И тогда он станет для вас полезным помощником, независимо от того, чем конкретно вы занимаетесь.`,
`3. Правила формулирования заданий для бота

1. Задавайте боту роль.
Тем самым вы задаете условия предоставления ответов.
Например: Действуй как мотивационный тренер. Придумывай стратегии, которые помогут человеку достичь свои целей.

2. Уточняйте.
Чем больше деталей - тем точнее актуальным и персонализированным будет ответ.

3. Ограничивайте.
Например: Предложи 3 варианта решения задачи. Используй для каждого варианта не более 10 слов.

4. Задавайте структуру в которой хотите видеть ответ.
Например: Сделай пошаговый алгоритм и разбей задачи на этапы с подзадачами.

5. Задавайте пример.
Например: Перепиши этот текст в таком стиле как следующее сообщение.

6. Сбрасывайте контекст при смене темы.
Бот запоминает первое сообщение и дальнейшие ответы. Сбрасывайте диалог, если хотите, чтобы бот переключился в другую роль и давал точные ответы.`,
`4. Используйте команды меню

Сбросить диалог /reset - сбрасывайте контекст диалога при переходе к новой теме.

Каталог ролей /prompt - выбирайте предустановленные роли для общения с ботом. 

Оформить подписку /premium - приобретите платную подписку для доступа к расширенным функциям бота.

Пригласить друзей /invite - приглашайте друзей, чтобы было с кем обсудить ваш опыт использования бота.

Техподдержка /support - напишите нам свои идеи и предложения.`,
`5. Учитывайте ограничения

В бесплатной версии

В целом`,
`6. Обучение завершено

Если дочитали до конца - вы молодец!

Пробуйте взаимодействовать с ботом разными способами для решения тех задач, которые у вас есть.

Развивайте внутреннее ощущение интереса и любопытства к происходящему.

Попробуйте написать свой первый запрос боту или выберите одну из предустановленных ролей в меню.`
];

export const tutorialScene = new WizardScene<BotContext>(
  scenes.tutorial,
  ...steps.map((step, index) => makeStepHandler(step, index === 0, index === steps.length - 1)),
  async (ctx) => await ctx.scene.leave()
);
