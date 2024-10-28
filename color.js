window.onload = function() {
    const startBtn = document.getElementById('play-transcription');
    const stopBtn = document.getElementById('stop-transcription');
    const resultText = document.getElementById('transcription');

    let recognition;
    let isRecognizing = false;
    let audioContext;
    let analyser;
    let mediaStreamSource;
    let filter;  // ノイズ除去用フィルタ
    let animationFrameId;
    let currentColor = "black"; // 現在の色を追跡
    let isSpeaking = false; // 話している状態かどうかを追跡

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
            recognition.stop(); // 音声認識の停止
            isRecognizing = false;
            isSpeaking = false; // 話していない状態にリセット
            startBtn.disabled = false;
            stopBtn.disabled = true;
            console.log("音声認識を停止しました");

            // 音声解析の停止
            stopAudioAnalysis();
        }
    };

    // 音声認識結果をテキストエリアに表示
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        console.log("音声認識結果:", transcript);
        resultText.value += ' ' + transcript;

        // 言葉を検知したのでスペクトル解析を開始
        isSpeaking = true; // 話している状態に変更
        startSpectralAnalysis();
    };

    // 音声認識が終了したときの動作
    recognition.onend = function() {
        if (isRecognizing) {
            console.log("音声認識を再開します");
            recognition.start();  // 停止ボタンが押されていない場合のみ自動再開
        } else {
            console.log("音声認識を完全に停止しました");
        }
        isSpeaking = false;
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
        isSpeaking = false;
    };

    // マイク入力の解析セットアップ
    function setupAudioAnalysis() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaStreamSource = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;  // FFTサイズの設定
                
                // ノイズ除去用のフィルタを追加
                filter = audioContext.createBiquadFilter();
                filter.type = "lowpass"; // ローパスフィルタで高周波ノイズを除去
                filter.frequency.setValueAtTime(3000, audioContext.currentTime); // 3000Hz以下を通す
                mediaStreamSource.connect(filter); 
                filter.connect(analyser); // フィルタをアナライザーに接続
            })
            .catch(error => {
                console.error("マイクのアクセスエラー:", error);
                alert("マイクのアクセスが拒否されました。");
            });
    }

    // 音声解析を停止
    function stopAudioAnalysis() {
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId); // 解析のループを停止
        }
    }

    // スペクトル解析の開始
    function startSpectralAnalysis() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function analyzeSpectrum() {
            analyser.getByteFrequencyData(dataArray); // 周波数データを取得
            let lowFreqEnergy = 0;
            let highFreqEnergy = 0;

            console.log("----- スペクトル解析結果 -----");
            
            // 周波数の範囲をチェック（低周波数帯と高周波数帯を分ける）
            for (let i = 0; i < bufferLength; i++) {
                let frequency = i * audioContext.sampleRate / analyser.fftSize;
                
                // 各周波数成分のエネルギーをコンソールに出力
                console.log(`周波数: ${frequency.toFixed(2)}Hz, エネルギー: ${dataArray[i]}`);

                if (frequency < 400) {  // 250Hz以下を低周波数帯とする
                    lowFreqEnergy += dataArray[i];
                } else if (frequency > 400 && frequency < 3000) {  // 250Hz〜3000Hzを高周波数帯とする
                    highFreqEnergy += dataArray[i];
                }
            }

            // 低周波数帯域と高周波数帯域のエネルギー比で性別を判定
            console.log(`低周波数帯のエネルギー合計: ${lowFreqEnergy}`);
            console.log(`高周波数帯のエネルギー合計: ${highFreqEnergy}`);

            if (highFreqEnergy > lowFreqEnergy && currentColor !== "red") {
                resultText.style.color = "red"; // 高い周波数が多い -> 女性の声
                currentColor = "red";
            } else if (lowFreqEnergy > highFreqEnergy && currentColor !== "blue") {
                resultText.style.color = "blue"; // 低い周波数が多い -> 男性の声
                currentColor = "blue";
            }

            // 話している状態のときのみループを続ける
            if (isSpeaking) {
                animationFrameId = requestAnimationFrame(analyzeSpectrum);
            }
        }

        analyzeSpectrum();  // スペクトル解析のループを開始
    }
};
