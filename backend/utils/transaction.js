export const withOptionalTransaction = async (action) => {
  let session = null;

  try {
    const mongoose = await import("mongoose");
    session = await mongoose.default.startSession();

    let result;
    await session.withTransaction(async () => {
      result = await action(session);
    });

    return result;
  } catch (error) {
    // This keeps local single-node Mongo setups usable while still preferring transactions in production.
    const transactionUnsupported =
      error.message.includes("Transaction numbers are only allowed") ||
      error.message.includes("replica set") ||
      error.message.includes("Transaction support is not enabled");

    if (!transactionUnsupported) {
      throw error;
    }

    return action(null);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
