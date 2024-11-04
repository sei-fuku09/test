// 発話者1と発話者2の音声認識をセットアップ
const recognition1 = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const recognition2 = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition1.lang = 'ja-JP'; // 日本語の音声認識設定
recognition2.lang = 'ja-JP';

recognition1.continuous = true;
recognition2.continuous = true;

const transcription1 = document.getElementById("transcription1");
const transcription2 = document.getElementById("transcription2");

const startRecognition1 = document.getElementById("start-recognition1");
const stopRecognition1 = document.getElementById("stop-recognition1");
const startRecognition2 = document.getElementById("start-recognition2");
const stopRecognition2 = document.getElementById("stop-recognition2");

// 発話者1の音声認識開始と停止
startRecognition1.onclick = () => {
    recognition1.start();
    startRecognition1.disabled = true;
    stopRecognition1.disabled = false;
};

stopRecognition1.onclick = () => {
    recognition1.stop();
    startRecognition1.disabled = false;
    stopRecognition1.disabled = true;
};

// 発話者2の音声認識開始と停止
startRecognition2.onclick = () => {
    recognition2.start();
    startRecognition2.disabled = true;
    stopRecognition2.disabled = false;
};

stopRecognition2.onclick = () => {
    recognition2.stop();
    startRecognition2.disabled = false;
    stopRecognition2.disabled = true;
};

// 音声認識の結果を発話者ごとに処理
recognition1.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript;
    transcription1.value += result + "\n"; // 発話者1の文字起こし結果を表示
};

recognition2.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript;
    transcription2.value += result + "\n"; // 発話者2の文字起こし結果を表示
};
