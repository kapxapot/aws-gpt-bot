import { User } from "../../src/entities/user";
import { getProductByCode, getProductInvoiceDescription } from "../../src/services/productService";
import { testUser } from "../testData";

describe("getProductInvoiceDescription", () => {
  test("[en] builds correct descriptions", () => {
    const user: User = {
      ...testUser,
      languageCode: "en"
    };

    expect(getProductInvoiceDescription(user, getProductByCode(user, "bundle-boss")))
      .toBe("A bundle of 🍥 400 gptokens to work with GPT-5 and DALL-E 3. No expiration date. The invoice can be shared and paid by other users and also multiple times.");

    expect(getProductInvoiceDescription(user, getProductByCode(user, "bundle-student-mini")))
      .toBe("A bundle of 500 requests to GPT-5 mini. No expiration date. The invoice can be shared and paid by other users and also multiple times.");
  });

  test("[ru] builds correct descriptions", () => {
    const user: User = {
      ...testUser,
      languageCode: "ru"
    };

    expect(getProductInvoiceDescription(user, getProductByCode(user, "bundle-boss")))
      .toBe("Пакет из 🍥 400 гптокенов для работы с GPT-5 и DALL-E 3. Не имеет срока действия. Инвойс может быть передан для оплаты другим пользователям, а также оплачен несколько раз.");

    expect(getProductInvoiceDescription(user, getProductByCode(user, "bundle-student-mini")))
      .toBe("Пакет из 500 запросов к GPT-5 mini. Не имеет срока действия. Инвойс может быть передан для оплаты другим пользователям, а также оплачен несколько раз.");
  });
});
