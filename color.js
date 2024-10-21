window.onload = function() {
    const startBtn = document.getElementById('play-transcription');
    const stopBtn = document.getElementById('stop-transcription');
    const resultText = document.getElementById('transcription');

    let recognition;
    let isRecognizing = false;
    let audioContext;
    let analyser;
    let mediaStreamSource;
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

        // 言葉を検知したのでピッチ計測を開始
        isSpeaking = true; // 話している状態に変更
        startPitchMeasurement();
    };

    // 音声認識が終了したときの動作
    recognition.onend = function() {
        if (isRecognizing) {
            console.log("音声認識を再開します");
            recognition.start();  // 停止ボタンが押されていない場合のみ自動再開
        } else {
            console.log("音声認識を完全に停止しました");
        }
        // 言葉が終了したらピッチ計測を止める
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
        // エラーが発生した場合もピッチ計測を止める
        isSpeaking = false;
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
                // 初期状態ではピッチ計測を行わない
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

    // ピッチの計測を開始
    function startPitchMeasurement() {
        const bufferLength = analyser.fftSize;
        const dataArray = new Float32Array(bufferLength); // getFloatTimeDomainData用に変更

        function autoCorrelate(buf, sampleRate) {
            let SIZE = buf.length;
            let MAX_SAMPLES = Math.floor(SIZE / 2);
            let best_offset = -1;
            let best_correlation = 0;
            let rms = 0;
            let foundGoodCorrelation = false;
            let correlations = new Array(MAX_SAMPLES);

            for (let i = 0; i < SIZE; i++) {
                rms += buf[i] * buf[i];
            }
            rms = Math.sqrt(rms / SIZE);
            if (rms < 0.01) // 無音と判定
                return -1;

            let lastCorrelation = 1;
            for (let offset = 0; offset < MAX_SAMPLES; offset++) {
                let correlation = 0;

                for (let i = 0; i < MAX_SAMPLES; i++) {
                    correlation += Math.abs((buf[i]) - (buf[i + offset]));
                }
                correlation = 1 - (correlation / MAX_SAMPLES);
                correlations[offset] = correlation;
                if ((correlation > 0.9) && (correlation > lastCorrelation)) {
                    foundGoodCorrelation = true;
                    if (correlation > best_correlation) {
                        best_correlation = correlation;
                        best_offset = offset;
                    }
                } else if (foundGoodCorrelation) {
                    let shift = (correlations[best_offset + 1] - correlations[best_offset - 1]) / correlations[best_offset];
                    return sampleRate / (best_offset + (8 * shift));
                }
                lastCorrelation = correlation;
            }
            if (best_correlation > 0.01) {
                return sampleRate / best_offset;
            }
            return -1;
        }

        function checkPitch() {
            analyser.getFloatTimeDomainData(dataArray); // Float32Arrayで時間領域のデータ取得
            let pitch = autoCorrelate(dataArray, audioContext.sampleRate);

            // ピッチが無音の場合は計測をスキップ
            if (pitch === -1) {
                console.log("無音状態です。ピッチは計測しません。");
            } else {
                // デバッグ情報の出力
                console.log("ピッチ:", pitch);

                // ピッチの範囲を基に性別を推定（ここでは簡略化して150Hzを基準とする）
                if (pitch > 180 && currentColor !== "red") {
                    resultText.style.color = "red"; // 高いピッチ -> 女性の声（赤色）
                    currentColor = "red"; // 色が赤に変更されたことを記録
                } else if (pitch > 75 && pitch <= 180 && currentColor !== "red" && currentColor !== "blue") {
                    resultText.style.color = "blue"; // 低いピッチ -> 男性の声（青色）
                    currentColor = "blue"; // 色が青に変更されたことを記録
                }
            }

            // 話している状態のときだけピッチ計測を続ける
            if (isSpeaking) {
                animationFrameId = requestAnimationFrame(checkPitch); // IDを保存して後でキャンセル可能に
            }
        }

        // ピッチ計測をスタート
        checkPitch();
    }
};
