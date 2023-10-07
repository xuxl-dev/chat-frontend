import { LoremIpsum } from "lorem-ipsum";
import { MessageWarp } from "./ChatMessage";
import { Message } from "./helpers/messageHelper";

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


export function randChat(count: number): MessageWarp[] {
  const messages: MessageWarp[] = [];
  for (let i = 0; i < count; i++) {
    const msg = new Message({
      msgId: i.toString(),
      senderId: randBetween(1, 2),
      receiverId: randBetween(1, 2),
      content: lorem.generateSentences(randBetween(1, 3)),
      hasReadCount: randBetween(0, 2),
      flag: 4
    })
    
    messages.push(MessageWarp.fromMessage(msg));
  }
  return messages;
}
