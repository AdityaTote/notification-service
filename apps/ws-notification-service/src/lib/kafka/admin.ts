import { kafka } from "./kafkaClient";

/*
This is a admin file to create a topic in kafka.
This file is used to create a topic.
execute this file while creating a topic.
run this file using the command below:
ts-node src/admin.ts
*/

export async function init() {
  const admin = kafka.admin();
  console.log("Admin connecting...");
  admin.connect();
  console.log("Adming Connection Success...");
  console.log("Creating Topic [resources-avability]");
  try {
    await admin.createTopics({
      topics: [
        {
          topic: "app-notification-avaliable",
          numPartitions: 1,
        },
        {
          topic: "app-notification-required",
          numPartitions: 1,
        },
      ],
    });
    console.log("Topic Created Success [resources-avability]");

    console.log("Disconnecting Admin..");
    await admin.disconnect();
  } catch (error) {
    console.log(error);
  }
}
init();
