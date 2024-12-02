const startBtn = document.getElementById('play-transcription');
const stopBtn = document.getElementById('stop-transcription');
const resultText = document.getElementById('transcription');
let recognition;
let isRecognizing = false;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
} else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
} else {
    alert('このブラウザは音声認識をサポートしていません');
}

recognition.lang = 'ja-JP';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

startBtn.onclick = function() {
    if (!isRecognizing) {
        recognition.start();
        isRecognizing = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        resultText.value = '';
    }
};

stopBtn.onclick = function() {
    if (isRecognizing) {
        recognition.stop();
        isRecognizing = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
};

recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript;
    sendAudioToServer(transcript).then(data => displayTranscription(data));
};

async function sendAudioToServer(transcript) {
    const response = await fetch('https://peaceful-tide-429307-m0.an.r.appspot.com//api/identify-speaker', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audio: transcript })
    });
    const data = await response.json();
    return data;
}

function displayTranscription(data) {
    const colorMap = { '1': 'blue', '2': 'red', '3': 'green' };
    const transcript = data.transcript;

    resultText.innerHTML += `<span style="color: ${colorMap[data.speakerId]};">${transcript}</span><br>`;
}
