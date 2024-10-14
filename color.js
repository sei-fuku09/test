window.onload = function() {
    const startBtn = document.getElementById('play-transcription');
    const stopBtn = document.getElementById('stop-transcription');
    const saveBtn = document.getElementById('save-transcription');
    const translateBtn = document.getElementById('translate-text');
    const translationDirection = document.getElementById('translation-direction');
    const resultText = document.getElementById('transcription');
    const translationText = document.getElementById('translation');

    let recognition;
    let isRecognizing = false;
    let audioContext;
    let analyser;
    let mediaStreamSource;

    // Web Speech APIを使った音声認識のセットアップ
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
        recognition = new SpeechRecognition();
    } else {
        alert('このブラウザは音声認識をサポートしていません');
        return;
    }

    recognition.lang = 'ja-JP';  // 日本語に設定
    recognition.interimResults = false;  // 確定結果のみを取得
    recognition.maxAlternatives = 1;

    // 音声認識開始
    startBtn.onclick = function() {
        if (!isRecognizing) {
            recognition.start();
            console.log("音声認識を開始しました");
            resultText.value = ''; // 初期化
            isRecognizing = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;

            // マイク入力の解析を開始
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

            // 音声解析を停止
            if (audioContext) audioContext.close();
        }
    };

    // 音声認識結果をテキストエリアに表示
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log("音声認識結果:", transcript);
        resultText.value += ' ' + transcript;
    };

    // 音声認識が終了したら自動的に再開（ユーザーが停止するまで）
    recognition.onend = function() {
        console.log("音声認識が終了しました");
        if (isRecognizing) {
            console.log("音声認識を再開します");
            recognition.start();  // 自動的に再開
        }
    };

    // エラー処理
    recognition.onerror = function(event) {
        console.error("音声認識エラー:", event.error);
        resultText.value = 'エラー: ' + event.error;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            alert("マイクのアクセスが拒否されました。設定を確認してください。");
            isRecognizing = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };

    // マイク入力の解析セットアップ
    function setupAudioAnalysis() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                mediaStreamSource.connect(analyser);
                analyser.fftSize = 2048;
                monitorAudio(); // 音声の高さ・デシベルを監視
            })
            .catch(error => {
                console.error("マイクのアクセスエラー:", error);
                alert("マイクのアクセスが拒否されました。");
            });
    }

    // 音声の高さとデシベルを監視して色を変更
    function monitorAudio() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function checkVoiceProperties() {
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }

            const averageVolume = sum / bufferLength; // 音量の平均を取得

            // ピッチ（声の高さ）を判別
            analyser.getByteTimeDomainData(dataArray);
            let pitch = detectPitch(dataArray, audioContext.sampleRate);

            // 色の設定: 仮に150Hz以上を「女性」、それ以下を「男性」とする
            if (pitch > 150 && averageVolume > 50) {
                resultText.style.color = "red"; // 高い音量とピッチ -> 女性の声（赤色）
            } else if (pitch <= 150 && averageVolume > 50) {
                resultText.style.color = "blue"; // 低い音量とピッチ -> 男性の声（青色）
            } else {
                resultText.style.color = "black"; // 中間音量 -> 中立（黒色）
            }

            requestAnimationFrame(checkVoiceProperties);
        }

        checkVoiceProperties();
    }

    // ピッチ（声の高さ）を推測する関数
    function detectPitch(data, sampleRate) {
        let sum = 0;
        let rms = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
            rms += data[i] * data[i];
        }
        rms = Math.sqrt(rms / data.length);
        if (rms < 0.01) return -1; // 無音

        let r1 = 0, r2 = data.length - 1;
        while (data[r1] < 128) r1++;
        while (data[r2] < 128) r2--;

        if (r2 - r1 < 2) return -1;

        const buffer = data.slice(r1, r2);
        const autocorr = new Array(buffer.length).fill(0);
        for (let lag = 0; lag < buffer.length; lag++) {
            for (let i = 0; i < buffer.length - lag; i++) {
                autocorr[lag] += (buffer[i] - 128) * (buffer[i + lag] - 128);
            }
        }

        let d = 0;
        while (autocorr[d] > autocorr[d + 1]) d++;
        let maxval = -1, maxpos = -1;
        for (let i = d; i < buffer.length; i++) {
            if (autocorr[i] > maxval) {
                maxval = autocorr[i];
                maxpos = i;
            }
        }

        if (maxpos === -1) return -1;
        const fundamentalFreq = sampleRate / maxpos;
        return fundamentalFreq;
    }

    // 保存機能、翻訳機能のコードはそのまま
    // ...
};
