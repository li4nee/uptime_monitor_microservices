import { getMessageBrokerConsumer } from "./lib/messageBrokerConsumer";
import { InternalServerError } from "./typings/base.type";

try {
  getMessageBrokerConsumer()
    .setupBroker()
    .then(() => {
      console.log("Worker message broker setup completed successfully.");
    })
    .catch((error) => {
      throw new InternalServerError("Failed to set up worker message broker: " + (error as Error).message);
    });
} catch (error) {
  throw new InternalServerError("Failed to set up worker message broker: " + (error as Error).message);
}
