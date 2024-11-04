window.onload = function() {
    const startBtn = document.getElementById('play-transcription');
    const stopBtn = document.getElementById('stop-transcription');
    const resultText = document.getElementById('transcription');

    let recognition;
    let isRecognizing = false;
    let audioContext;
    let analyser;
    let mediaStreamSource;
    let filter;
    let animationFrameId;
    let currentColor = "black";
    let isSpeaking = false;

    // Web Speech APIのセットアップ
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
    } else {
        alert('このブラウザは音声認識をサポートしていません');
        return;
    }

    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // 音声認識開始
    startBtn.onclick = function() {
        if (!isRecognizing) {
            recognition.start();
            console.log("音声認識を開始しました");
            resultText.value = '';
            isRecognizing = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
            setupAudioAnalysis();
        }
    };

    // 音声認識停止
    stopBtn.onclick = function() {
        if (isRecognizing) {
            recognition.stop();
            console.log("音声認識を停止しました");
            isRecognizing = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            stopAudioAnalysis();
        }
    };

    // 音声認識結果を表示
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log("音声認識結果:", transcript);
        resultText.value += ' ' + transcript;
        resultText.scrollTop = resultText.scrollHeight;

        isSpeaking = true;
        startSpectralAnalysis();
    };

    recognition.onend = function() {
        if (isRecognizing) {
            console.log("音声認識を再開します");
            recognition.start();
        } else {
            console.log("音声認識を完全に停止しました");
        }
        isSpeaking = false;
    };

    recognition.onerror = function(event) {
        console.error("音声認識エラー:", event.error);
        alert("エラー: " + event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("マイクのアクセスが拒否されました。設定を確認してください。");
            isRecognizing = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
        isSpeaking = false;
    };

    function setupAudioAnalysis() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;

                filter = audioContext.createBiquadFilter();
                filter.type = "lowpass";
                filter.frequency.setValueAtTime(3000, audioContext.currentTime);
                mediaStreamSource.connect(filter);
                filter.connect(analyser);
            })
            .catch(error => {
                console.error("マイクのアクセスエラー:", error);
                alert("マイクのアクセスが拒否されました。");
            });
    }

    function stopAudioAnalysis() {
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }

    function startSpectralAnalysis() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function analyzeSpectrum() {
            analyser.getByteFrequencyData(dataArray);
            let lowFreqEnergy = 0;
            let highFreqEnergy = 0;

            for (let i = 0; i < bufferLength; i++) {
                let frequency = i * audioContext.sampleRate / analyser.fftSize;
                if (frequency < 1200) {
                    lowFreqEnergy += dataArray[i];
                } else if (frequency > 1200 && frequency < 3000) {
                    highFreqEnergy += dataArray[i];
                }
            }

            if (highFreqEnergy > lowFreqEnergy && currentColor !== "red") {
                resultText.style.color = "red";
                currentColor = "red";
            } else if (lowFreqEnergy > highFreqEnergy && currentColor !== "blue") {
                resultText.style.color = "blue";
                currentColor = "blue";
            }

            if (isSpeaking) {
                animationFrameId = requestAnimationFrame(analyzeSpectrum);
            }
        }

        analyzeSpectrum();
    }
};
