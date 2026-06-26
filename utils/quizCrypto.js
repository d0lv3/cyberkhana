// Quiz encoding/decoding utility
// Uses Base64 + XOR to prevent casual inspection of answers

const KEY_PARTS = ['d0', 'lv', '3c', 'yb', 'er'];
const getKey = () => KEY_PARTS.join('');

export function encodeAnswer(answer) {
    const key = getKey();
    let encoded = '';
    for (let i = 0; i < answer.length; i++) {
        encoded += String.fromCharCode(
            answer.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return btoa(encoded);
}

export function decodeAnswer(encodedAnswer) {
    const key = getKey();
    const decoded = atob(encodedAnswer);
    let answer = '';
    for (let i = 0; i < decoded.length; i++) {
        answer += String.fromCharCode(
            decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }
    return answer;
}

export function checkAnswer(userAnswer, encodedCorrect) {
    return userAnswer.trim().toLowerCase() === decodeAnswer(encodedCorrect).trim().toLowerCase();
}
