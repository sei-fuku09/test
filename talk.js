document.addEventListener("DOMContentLoaded", () => {
    const textInput = document.getElementById("text-input");
    const playbackSpeed = document.getElementById("playback-speed");
    const speedDisplay = document.getElementById("speed-display");
    const playButton = document.getElementById("play-sound");
    const saveButton = document.getElementById("save-audio");
    const reverseButton = document.getElementById("reverse-text");

    let utterance = new SpeechSynthesisUtterance();

    // 再生速度のスライダーを動かしたときの処理
    playbackSpeed.addEventListener("input", () => {
        const speed = playbackSpeed.value;
        speedDisplay.textContent = speed;
        utterance.rate = speed; // 音声の再生速度を更新
    });

    // 「再生」ボタンをクリックしたときの処理
    playButton.addEventListener("click", () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel(); // 既に音声合成中の場合は停止する
        }

        const text = textInput.value;
        if (text.trim()) {
            utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = playbackSpeed.value;
            speechSynthesis.speak(utterance);
        } else {
            alert("テキストを入力してください。");
        }
    });

    // 音声の保存処理（※注意: ブラウザのみでは完全にはサポートされていません）
    saveButton.addEventListener("click", () => {
        alert("音声保存機能はこのブラウザでサポートされていません。");
    });

    // 「文字を反転」ボタンの処理
    reverseButton.addEventListener("click", () => {
        // テキストエリアを上下反転させる
        if (textInput.classList.contains("reversed")) {
            textInput.classList.remove("reversed");
        } else {
            textInput.classList.add("reversed");
        }
    });
});
