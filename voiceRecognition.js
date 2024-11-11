window.onload = function() {
    const startBtn = document.getElementById('play-transcription');
    const stopBtn = document.getElementById('stop-transcription');
    const translateBtn = document.getElementById('translate-text');
    const translationDirection = document.getElementById('translation-direction');
    const resultText = document.getElementById('transcription');
    const translationText = document.getElementById('translation');

    let recognition;
    let isRecognizing = false;
    let finalTranscript = ''; // 全ての確定結果を保持する変数

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
    recognition.interimResults = true;  // 中間結果を取得するように設定
    recognition.maxAlternatives = 1;

    // 音声認識開始
    startBtn.onclick = function() {
        if (!isRecognizing) {
            recognition.start();
            console.log("音声認識を開始しました");
            isRecognizing = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;
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
        }
    };

    // 音声認識結果をリアルタイムでテキストエリアに追加表示
    recognition.onresult = function(event) {
        let interimTranscript = '';  // 中間結果用

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';  // 確定結果を追加
            } else {
                interimTranscript += transcript;  // 中間結果を追加
            }
        }

        // テキストエリアに既存の確定結果 + 中間結果をリアルタイムで表示
        resultText.value = finalTranscript + interimTranscript;
        resultText.scrollTop = resultText.scrollHeight;  // スクロールを常に下に維持
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

    // 翻訳機能
    translateBtn.onclick = function() {
        const transcriptionContent = resultText.value;
        const selectedDirection = translationDirection.value;

        if (transcriptionContent) {
            translateText(transcriptionContent, selectedDirection).then(translated => {
                translationText.value = translated;
            }).catch(error => {
                alert("翻訳に失敗しました: " + error);
            });
        } else {
            alert("翻訳する文字起こしデータがありません");
        }
    };

    // 翻訳APIを呼び出す関数
    function translateText(text, direction) {
        return new Promise((resolve, reject) => {
            const apiKey = 'AIzaSyCDvA-j10o8HeWZFJ7TbcdpSSRyxiwdd7w';  // Google Cloud Translation APIキー
            let targetLanguage = '';

            if (direction === 'ja-en') {
                targetLanguage = 'en';
            } else if (direction === 'en-ja') {
                targetLanguage = 'ja';
            }

            const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
            const body = {
                q: text,
                target: targetLanguage,
                format: 'text'
            };

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
            .then(response => response.json())
            .then(data => {
                if (data.data && data.data.translations && data.data.translations[0].translatedText) {
                    resolve(data.data.translations[0].translatedText);
                } else {
                    reject("翻訳結果がありません");
                }
            })
            .catch(error => {
                reject("翻訳中にエラーが発生しました: " + error);
            });
        });
    }
};
