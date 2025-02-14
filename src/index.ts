import { createEventAdapter } from "@slack/events-api";
import { WebClient } from "@slack/web-api";
import express from "express";
import getCurrentHistory from "./getCurrentHistory";
import schedule from 'node-schedule';
import { getCstodo, setCstodo, getHistory, setHistory } from "./file";
import { accessToken, signingSecret } from "./config";

const app = express();

const slackEvents = createEventAdapter(signingSecret);
const webClient = new WebClient(accessToken);

const bulletEmoji: string[] = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:", ":keycap_ten:"];

slackEvents.on('message', async (event) => {
  console.log(event);

  const text : string = event.text;
  const tokens = text.split(' ');

  if (tokens[0] === 'cstodo') {
    let cstodo = await getCstodo();
    if (tokens[1] === 'length' || tokens[1] == 'size') {
      webClient.chat.postMessage({
        text: 'cs님의 할 일은 총 ' + String(cstodo.length) + ' 개가 있어요... :시신:',
        channel: event.channel,
      });
    }
    if (tokens[1] === 'add' && tokens.length >= 3) {
      let query = tokens.slice(2).join(' ');
      cstodo.push(query);
      setCstodo(cstodo);
    }

    if (tokens[1] === 'remove' && tokens.length >= 3) {
      let query = tokens.slice(2).join(' ');
      cstodo = cstodo.filter((value) => value !== query);
      setCstodo(cstodo);
    }
    let fmtText = ':god: :시신: 할 일 목록 :god: : \n';
    if (tokens[1] === 'format') {
      for(var i = 0; i < bulletEmoji.length && i < cstodo.length; i++) {
        fmtText += bulletEmoji[i] + ' ' + cstodo[i] + '\n';
      }
      var remainingTodos = String(Math.max(0, cstodo.length - bulletEmoji.length));
      if(cstodo.length > bulletEmoji.length) {
        fmtText += '아직도 할 일이 ' + remainingTodos + '개나 더 있어요... :blobaww:\n'
      }
    } else {
      fmtText += cstodo.join(', ');
    }
    webClient.chat.postMessage({
      text: fmtText,
      channel: event.channel,
    });
  }
});

schedule.scheduleJob('0 0 0 * * *', async () => {
  const history = await getHistory();
  const currentHistory = await getCurrentHistory();

  setHistory(currentHistory);

  const diff = currentHistory.filter((value) => !history.find((item) => item === value));

  webClient.chat.postMessage({
    text: '오늘 :god: :시신: :god:님이 푼 문제들: ' + diff.map((item) => `<http://icpc.me/${item}|${item}>`).join(', '),
    channel: 'C01H4RY69CL'
  })
});

app.use('/cstodo', slackEvents.requestListener());

// express 웹 서버 실행
app.listen(3000, () => {
  console.log('Running slackbot..');
});