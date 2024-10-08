window.onload = function() {
    const fileInput = document.getElementById('file-upload');
    const startBtn = document.getElementById('start-transcription');
    const statusText = document.getElementById('upload-status');
    const fileList = document.getElementById('file-list');
    
    let audioBlob = null;

    // ファイルが選択されたときにイベント発火
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            statusText.textContent = `ファイル名: ${file.name}`;

            reader.onerror = function(error) {
                console.error("ファイル読み込み中にエラーが発生しました:", error);
                statusText.textContent = 'ファイルの読み込みに失敗しました';
            };
            reader.readAsArrayBuffer(file);
        }
    });

    // 音声ファイルをAPIに送信して文字起こし
    startBtn.onclick = function() {
        if (audioBlob) {
            statusText.textContent = '文字起こし中...';

            // Google Cloud Speech-to-Text APIに送信
            const apiKey = 'AIzaSyCDvA-j10o8HeWZFJ7TbcdpSSRyxiwdd7w';  // ここにGoogle APIキーを挿入
            const apiUrl = `https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`;
            
            // オーディオファイルをBase64に変換
            const reader = new FileReader();
            reader.onloadend = function() {
                const audioBase64 = reader.result.split(',')[1];

                const requestBody = {
                    config: {
                        encoding: "FLAC",
                        sampleRateHertz: 16000,
                        languageCode: "ja-JP"
                    },
                    audio: {
                        content: audioBase64
                    }
                };

                // APIリクエスト
                fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.results) {
                        const transcription = data.results.map(result => result.alternatives[0].transcript).join('\n');
                        statusText.textContent = '認識結果: ' + transcription;
                        saveTranscription(transcription);
                    } else {
                        statusText.textContent = '文字起こしに失敗しました';
                        console.error("文字起こしエラー:", data);
                    }
                })
                .catch(error => {
                    statusText.textContent = 'API通信中にエラーが発生しました';
                    console.error("APIエラー:", error);
                });
            };
            reader.readAsDataURL(audioBlob);
        }
    };

    // 文字起こし結果を保存
    function saveTranscription(transcription) {
        const currentDateTime = new Date().toLocaleString();
        const savedTranscription = {
            id: new Date().getTime(),
            content: transcription,
            date: currentDateTime
        };

        let savedData = JSON.parse(localStorage.getItem('transcriptions')) || [];
        savedData.push(savedTranscription);
        localStorage.setItem('transcriptions', JSON.stringify(savedData));

        displaySavedTranscriptions();
    }

    // 保存された文字起こしデータを表示
    function displaySavedTranscriptions() {
        fileList.innerHTML = ''; // 既存のリストをクリア
        const savedData = JSON.parse(localStorage.getItem('transcriptions')) || [];

        savedData.forEach((transcription) => {
            const listItem = document.createElement('li');
            listItem.textContent = `ID: ${transcription.id} - 日時: ${transcription.date}`;
            listItem.style.cursor = 'pointer';

            // クリックで内容を表示
            listItem.onclick = function() {
                alert('保存された文字起こし内容:\n\n' + transcription.content);
            };

            fileList.appendChild(listItem);
        });
    }

    // 初回読み込み時に保存されたデータを表示
    displaySavedTranscriptions();
};
