import { serve } from "https://deno.land/std@0.119.0/http/server.ts";
import readline from "npm:readline";
import seedrandom from "npm:seedrandom";



function getRandomInt(min, max) {
    
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = mm + '-' + dd + '-' + yyyy;
    console.log(today)
    const generator = seedrandom('today');

    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(generator() * (max - min + 1)) + min;
}

async function getTodayWord() {
  const f=await Deno.open('./lemmes.txt');
  const array = [];

  for await(const l of readLines(f))
    array.push(l)
  

  console.log(array.length)
  const number = getRandomInt(0,array.length)
  console.log(number)
  console.log(array[number])
  return array[number]
}


async function handler(_req: Request): Promise<Response> {
  console.log("coucou")
    try {
    const wordToFind = getTodayWord();
    let js = await _req.json();
    const guess = await extractGuess(js);
    const similarityResult = await similarity(guess, wordToFind);
    console.log(
      `Tried with word ${guess}, similarity is ${similarityResult}, word to find is ${wordToFind}`
    );
    fetch("https://api.telegram.org/bot6325097084:AAHkznRDkncIz25zFOEPzINDj8zUDZiR97s/sendMessage", {
      method: "POST",
      body: JSON.stringify({
      chat_id: js.message.chat.id,
      text: responseBuilder(guess, similarityResult)
    }),
  headers: {
    "Content-type": "application/json; charset=UTF-8"
  }
});
    return new Response(responseBuilder(guess, similarityResult));
  } catch (e) {
    console.error(e);
    return new Response("An error occured : ", e);
  }
}

const extractGuess = async (js) => {
  console.log(js);
  const guess = js.message.text;
  if (!guess) {
    throw Error("Guess is empty or null");
  }
  return guess;
};

const responseBuilder = (word: string, similarity: Number) => {
  if (similarity == 1) {
    return `Well played ! The word was ${word}.`;
  } else if (similarity > 0.5) {
    return `${word} is very close to the word, score : ${similarity}`;
  } else if (similarity < 0.5) {
    return `${word} is quite far to the word, score : ${similarity}`;
  }
};

const similarity = async (word1, word2) => {
  const body = {
    sim1: word1,
    sim2: word2,
    lang: "fr",
    type: "General Word2Vec",
  };
  console.log("body", body);
  const similarityResponse = await fetch(
    "http://nlp.polytechnique.fr/similarityscore",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  console.log("similarityResponse", similarityResponse);
  const similarityResponseJson = await similarityResponse.json();
  console.log("similarityValue", similarityResponseJson);
  return Number(similarityResponseJson.simscore);
};

serve(handler);