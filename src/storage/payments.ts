import { getItem, putItem, updateItem } from "../lib/database";
import { Payment } from "../entities/payment";
import { Timestampless } from "../entities/at";

const paymentsTable = process.env.PAYMENTS_TABLE!;

export const storePayment = async (payment: Timestampless<Payment>) => await putItem<Payment>(
  paymentsTable,
  payment
);

export const getPayment = async (id: string): Promise<Payment | null> =>
  await getItem<Payment>(paymentsTable, id);

export const updatePayment = async (payment: Payment, changes: Record<string, any>): Promise<Payment> =>
  await updateItem<Payment>(
    paymentsTable,
    {
      id: payment.id
    },
    changes
  );
