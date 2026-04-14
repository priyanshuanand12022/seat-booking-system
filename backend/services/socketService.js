let ioInstance = null;

export const setSocketServer = (io) => {
  ioInstance = io;
};

export const getSocketServer = () => ioInstance;

export const broadcastAvailabilityUpdate = (dateKey) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.emit("availability-updated", {
    date: dateKey,
    updatedAt: new Date().toISOString(),
  });
};
