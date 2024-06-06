import { ENGLISH } from "./words.js";
import "./menu.js";

const wordsContainer = document.querySelector(".words-container");
const timerEl = document.querySelector(".timer");
const resultEl = document.querySelector(".result");
const restartBtn = document.getElementById("restart-btn");
const caretEl = document.getElementById("caret");

let wordsElArr = wordsContainer.querySelectorAll("div.word");

// 0 = time, 1 = word
let typingMode = 0;
let maxWords = 25;
let maxTime = 60; // seconds
let language = "english";

const userState = {
  typedWords: [],
  totalKeystrokes: 0,
  currentWordIndex: -1,
  currentLetterIndex: -1,
  wordBuffer: "",
  time: 0,
};

let started = false;
let testOver = false;

let interval = null;
let currentWord = "";
let wordsArr = [];

export function switchTypingMode(type) {
  typingMode = type;
  setupTypingTest();
}

export function switchModeOptions(mode, option) {
  if (mode === 0) maxTime = option;
  if (mode === 1) maxWords = option;
  setupTypingTest();
}

document.addEventListener("keydown", handleKeys);
restartBtn.addEventListener("click", () => {
  restartBtn.blur();
  setupTypingTest();
});

let _resizeTimeout = 0;
window.addEventListener("resize", () => {
  clearTimeout(_resizeTimeout);
  _resizeTimeout = setTimeout(_onResizeEnd, 400);
});
function _onResizeEnd() {
  const linesToScroll = getLinesToScroll();
  for (let i = 0; i < linesToScroll; i++) {
    deletePreviousLine(linesToScroll);
  }
}

// this is called after the words container scrolls
wordsContainer.addEventListener("transitionend", () => {
  wordsContainer.style.transition = "all 0s";
  wordsContainer.style.marginTop = "0px";

  wordsElArr = wordsContainer.querySelectorAll("div.word");
  const amountToDelete = getAmountToDelete();
  for (let i = 0; i < amountToDelete; i++) {
    wordsArr.shift();
    wordsElArr.item(i).remove();
    if (typingMode === 0) {
      addNewWord(getRandomWord());
    }
  }
  userState.currentWordIndex -= amountToDelete;
  updateCaret(getLetterEl(getWordEl()), false);
});

setupTypingTest();

function setupTypingTest() {
  clearInterval(interval);
  wordsContainer.innerHTML = "";
  resultEl.textContent = "";
  timerEl.textContent = "00:00";
  wordsArr = [];

  if (typingMode === 0) {
    setupWords(80);
  } else {
    setupWords(maxWords);
  }

  wordsElArr = wordsContainer.querySelectorAll("div.word");

  currentWord = wordsArr[0] || "";
  userState.totalKeystrokes = 0;
  userState.currentWordIndex = 0;
  userState.currentLetterIndex = 0;
  userState.wrongWords = 0;
  userState.wordBuffer = "";
  userState.typedWords = [];
  started = false;
  testOver = false;
  updateCaret(getLetterEl(wordsElArr.item(0)), false);

  caretEl.classList.add("blink");
}

function startTypingTest() {
  caretEl.classList.remove("blink");
  started = true;
  testOver = false;
  userState.time = performance.now();
  interval = setInterval(testTick, 500);
}

function testTick() {
  const secondsPassed = Math.floor((performance.now() - userState.time) / 1000);
  if (typingMode === 1) updateTimer(secondsPassed);
  else if (typingMode === 0) {
    const timeout = maxTime - secondsPassed;
    if (timeout <= 0) endTest();
    updateTimer(timeout);
  }
}

function endTest() {
  userState.typedWords.push({
    word: userState.wordBuffer,
    wrong: currentWord !== userState.wordBuffer,
  });
  started = false;
  testOver = true;
  clearInterval(interval);
  calculateResult();
}

function calculateResult() {
  const time = (performance.now() - userState.time) / 1000 / 60;
  const { totalKeystrokes, typedWords } = userState;

  const wrongWords = typedWords.reduce((a, el) => {
    return a + Number(el.wrong);
  }, 0);

  console.log(
    `wrong words: ${wrongWords}`,
    `total keystrokes: ${totalKeystrokes}`,
    `time(secs): ${time * 60}`,
    `raw wpm: ${totalKeystrokes / (5 * time)}`,
    typedWords
  );
  const result = (totalKeystrokes / 5 - wrongWords) / time;
  resultEl.textContent = `${result.toFixed(2)}wpm`;
}

function updateTimer(sec) {
  const minutes = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (sec % 60).toString().padStart(2, "0");
  timerEl.textContent = `${minutes}:${seconds}`;
}

function getRandomWord(lang = language) {
  const rnd = Math.floor(Math.random() * 100);
  return ENGLISH[rnd];
}

function addNewWord(word) {
  wordsArr.push(word);
  wordsContainer.appendChild(createWordEl(word));
}

function setupWords(wordsAmount = maxWords) {
  for (let i = 0; i < wordsAmount; i++) {
    const randomWord = getRandomWord();
    addNewWord(randomWord);
  }
}

function createWordEl(word) {
  const wordDiv = document.createElement("div");
  wordDiv.classList = "word";
  for (let i = 0; i < word.length; i++) {
    wordDiv.appendChild(createLetterEl(word[i]));
  }
  return wordDiv;
}

function createLetterEl(letter, classList = null) {
  const letterEl = document.createElement("span");
  letterEl.textContent = letter;
  if (classList) letterEl.classList = classList;
  return letterEl;
}

function getLetterEl(currentWordEl, index = userState.currentLetterIndex) {
  return currentWordEl.querySelectorAll("span").item(index);
}

function getWordEl(index = userState.currentWordIndex) {
  return wordsContainer.querySelectorAll("div.word").item(index);
}

function getWordHeightOffset() {
  const gap = 12;
  const wordHeight = wordsContainer
    .querySelector("div.word")
    .getBoundingClientRect().height;
  return wordHeight + gap;
}

function updateCaret(letterEl, addWidth = true) {
  const letterPosition = letterEl.getBoundingClientRect();
  const offset = wordsContainer.getBoundingClientRect();

  let x = letterPosition.x - offset.x - 1;
  const y = letterPosition.y - offset.y;
  if (addWidth) x += letterPosition.width;

  caretEl.style.left = `${x}px`;
  caretEl.style.top = `${y}px`;
}

function canCreateMoreWords() {
  const { currentWordIndex } = userState;

  const currentWord = getWordEl(currentWordIndex - 1);
  const nextWord = getWordEl(currentWordIndex);

  if (currentWord == null || nextWord == null) return false;

  const containerDim = wordsContainer.getBoundingClientRect();
  const wordDim = currentWord.getBoundingClientRect();
  const nextWordDim = nextWord.getBoundingClientRect();

  return wordDim.y > containerDim.y && wordDim.y < nextWordDim.y;
}

function getLinesToScroll() {
  const { currentWordIndex } = userState;

  const currentWord = getWordEl(currentWordIndex);

  if (currentWord == null) return 0;

  const wordDim = currentWord.getBoundingClientRect();
  const offset = wordsContainer.getBoundingClientRect().y;
  const wordHeightOffset = getWordHeightOffset();

  return (wordDim.y - offset) / wordHeightOffset;
}

function getAmountToDelete() {
  const words = wordsContainer.querySelectorAll("div.word");
  const positionY = words.item(0).getBoundingClientRect().y;
  let amount = 0;
  words.forEach((word) => {
    if (word.getBoundingClientRect().y !== positionY) return;
    amount++;
  });
  return amount;
}

function deletePreviousLine(amount = 1) {
  wordsContainer.style.transition = "all 250ms ease";
  wordsContainer.style.marginTop = `-${getWordHeightOffset() * amount}px`;
}

function goToPreviousWord() {
  userState.currentWordIndex--;
  currentWord = wordsArr[userState.currentWordIndex];
  userState.wordBuffer = userState.typedWords.pop().word;
  userState.currentLetterIndex = userState.wordBuffer.length;
}

function deleteWholeWord() {
  const currentWordEl = getWordEl();
  userState.wordBuffer = "";
  userState.currentLetterIndex = 0;
  updateCaret(getLetterEl(currentWordEl, 0), false);
  currentWordEl.querySelectorAll("span").forEach((letterEl, i) => {
    if (i < currentWord.length) {
      letterEl.classList = "";
    } else {
      // remove extra letters
      letterEl.remove();
    }
  });
}

function handleBackspace(ctrlKey) {
  let currentWordEl = getWordEl();
  let currentLetterEl = getLetterEl(currentWordEl);

  const { typedWords, currentWordIndex } = userState;

  const canGoBackToPreviousWord =
    userState.currentLetterIndex === 0 &&
    currentWordIndex > 0 &&
    typedWords[typedWords.length - 1].wrong;

  if (canGoBackToPreviousWord) {
    goToPreviousWord();

    currentWordEl = getWordEl();
    currentLetterEl = getLetterEl(
      currentWordEl,
      userState.currentLetterIndex - 1
    );
    updateCaret(currentLetterEl);
    if (!ctrlKey) return;
  }

  if (ctrlKey) {
    deleteWholeWord();
    return;
  }
  // delete letter
  userState.wordBuffer = userState.wordBuffer.slice(0, -1);
  userState.currentLetterIndex = userState.wordBuffer.length;
  currentLetterEl = getLetterEl(currentWordEl);
  // remove extras
  if (userState.wordBuffer.length >= currentWord.length) {
    currentLetterEl.remove();
  }
  currentLetterEl.classList = "";
  
  if (userState.currentLetterIndex === 0) {
    updateCaret(
      getLetterEl(currentWordEl, userState.currentLetterIndex),
      false
    );
  } else {
    updateCaret(getLetterEl(currentWordEl, userState.currentLetterIndex - 1));
  }
}

function handleSpacebar() {
  if (userState.wordBuffer === "") return;

  userState.totalKeystrokes++;
  userState.currentWordIndex++;
  userState.currentLetterIndex = 0;

  if (typingMode === 1 && userState.currentWordIndex === wordsArr.length) {
    endTest();
    return;
  }

  userState.typedWords.push({
    word: userState.wordBuffer,
    wrong: currentWord !== userState.wordBuffer,
  });
  userState.wordBuffer = "";

  if (!canCreateMoreWords()) {
    updateCaret(getLetterEl(getWordEl()), false);
  } else {
    deletePreviousLine();
  }

  currentWord = wordsArr[userState.currentWordIndex];
}

function handleKeys(event) {
  const { key, ctrlKey } = event;

  if (key === "Tab") {
    event.preventDefault();
    setupTypingTest();
    return;
  }

  if (testOver) return;

  let currentWordEl = getWordEl();
  let currentLetterEl = getLetterEl(currentWordEl);

  if (key === "Backspace") {
    handleBackspace(ctrlKey);
    return;
  }

  if (key.length !== 1) return;

  if (!started) {
    startTypingTest();
  }

  if (key === " ") {
    handleSpacebar();
    return;
  }

  if (userState.wordBuffer.length < currentWord.length) {
    userState.totalKeystrokes++;
  } else {
    const extra = createLetterEl(key, "extra");
    currentWordEl.appendChild(extra);
    currentLetterEl = extra;
  }

  userState.wordBuffer += key;
  userState.currentLetterIndex = userState.wordBuffer.length;
  updateCaret(currentLetterEl);

  const { currentLetterIndex } = userState;

  if (
    currentWord[currentLetterIndex - 1] !==
    userState.wordBuffer[currentLetterIndex - 1]
  ) {
    currentLetterEl.classList.add("wrong");
    return;
  }
  currentLetterEl.classList.add("correct");

  if (
    typingMode === 1 &&
    userState.currentWordIndex === wordsArr.length - 1 &&
    currentLetterIndex === currentWord.length
  ) {
    endTest();
  }
}
