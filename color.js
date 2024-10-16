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
    let animationFrameId;
    let currentColor = "black"; // 現在の色を追跡

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
    };

    // 音声認識が終了したときの動作
    recognition.onend = function() {
        if (isRecognizing) {
            console.log("音声認識を再開します");
            recognition.start();  // 停止ボタンが押されていない場合のみ自動再開
        } else {
            console.log("音声認識を完全に停止しました");
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

    // 音量のみに基づいて色を変更
    function monitorAudio() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function checkVolume() {
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }

            const averageVolume = sum / bufferLength; // 音量の平均を取得

            // デバッグ情報の出力
            console.log("音量:", averageVolume);

            // 色の設定: 高い音量 -> 女性の声（赤色）、低い音量 -> 男性の声（青色）
            if (averageVolume > 100 && currentColor !== "red") {
                resultText.style.color = "red"; // 高い音量 -> 女性の声（赤色）
                currentColor = "red"; // 色が赤に変更されたことを記録
            } else if (averageVolume > 10 && currentColor !== "red" && currentColor !== "blue") {
                resultText.style.color = "blue"; // 低い音量 -> 男性の声（青色）
                currentColor = "blue"; // 色が青に変更されたことを記録
            } 

            // 一度赤か青になったら、それ以上は変更しない
            animationFrameId = requestAnimationFrame(checkVolume); // IDを保存して後でキャンセル可能に
        }

        checkVolume();
    }
};
