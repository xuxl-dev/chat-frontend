import { LoremIpsum } from "lorem-ipsum";
import { MessageWarp } from "./ChatMessage";

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
    messages.push(new MessageWarp(
      `Sender${randBetween(0, 1) === 0 ? "A" : "B"}`,
      "",
      lorem.generateSentences(randBetween(1, 10)),
      randBetween(0, 3) === 1,
      randBetween(0, 4) === 1,
      randBetween(0, 100)
    ));
  }
  return messages;
}
