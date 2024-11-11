window.onload = function() {
    const startBtn = document.getElementById('play-transcription');
    const stopBtn = document.getElementById('stop-transcription');
    const translateBtn = document.getElementById('translate-text');
    const translationDirection = document.getElementById('translation-direction');
    const resultText = document.getElementById('transcription');
    const translationText = document.getElementById('translation');
    
    // ボタンの削除により、以下の行をコメントアウトまたは削除
    // const saveBtn = document.getElementById('save-transcription');

    let recognition;
    let isRecognizing = false;

    // その他のコード...

    // 保存機能の削除または無効化
    /*
    saveBtn.onclick = function() {
        const transcriptionContent = resultText.value;
        if (transcriptionContent) {
            const currentDateTime = new Date().toLocaleString();
            const savedTranscription = {
                id: new Date().getTime(),
                content: transcriptionContent,
                date: currentDateTime
            };

            let savedData = JSON.parse(localStorage.getItem('transcriptions')) || [];
            savedData.push(savedTranscription);

            localStorage.setItem('transcriptions', JSON.stringify(savedData));
            alert("文字起こしデータを保存しました！");
        } else {
            alert("保存する文字起こしデータがありません");
        }
    };
    */

    // 翻訳機能のイベントリスナー
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
            const apiKey = 'YOUR_GOOGLE_TRANSLATION_API_KEY';
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
