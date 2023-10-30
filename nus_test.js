/********** UIの要素 ***********/
// ボタン
const btn_connect    = document.getElementById('btn_connect');    // 接続
const btn_send       = document.getElementById('btn_send');       // 送信
const btn_clear      = document.getElementById('btn_clear');      // クリア
const btn_disconnect = document.getElementById('btn_disconnect'); // 切断
// 表示領域
const panel_connect = document.getElementById('panel_connect');
const panel_main    = document.getElementById('panel_main');
// 接続時のメッセージ
const text_connect = document.getElementById('text_connect');
// テキストエリア
const text_tx = document.getElementById('text_tx');
const text_rx = document.getElementById('text_rx');

/********** BLEの定数 ***********/
// BLEサービスのUUID
const UUID_NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UUID_NUS_RX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // ※ペリフェラル側から見てのRX
const UUID_NUS_TX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ※ペリフェラル側から見てのTX

/********** BLEの変数 ***********/
// BLEデバイス
let bleDevice = null;
// BLEキャラクタリスティック
let chrRX; // ※ペリフェラル側から見てのRX
let chrTX; // ※ペリフェラル側から見てのTX

/********** UIのイベントハンドラ ***********/
// 「接続」ボタン
btn_connect.addEventListener('click', async function () {
  try {
    // デバイスを取得 (サービスのUUIDでフィルタ)
    console.log("Requesting Bluetooth Device...");
    bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ services: [UUID_NUS_SERVICE] }],
    });
    // 切断時イベントハンドラの登録
    bleDevice.addEventListener('gattserverdisconnected', onDisconnected);
    // デバイスに接続
    text_connect.innerText = "接続中...";
    console.log("Connecting to GATT Server...");
    const server = await bleDevice.gatt.connect();
    // サービスを取得
    text_connect.innerText = "デバイス情報取得中...";
    console.log("Getting Service...");
    const service = await server.getPrimaryService(UUID_NUS_SERVICE);
    // キャラクタリスティックを取得
    console.log("Getting Characteristics...");
    chrTX = await service.getCharacteristic(UUID_NUS_TX_CHAR);
    chrRX = await service.getCharacteristic(UUID_NUS_RX_CHAR);
    // 受信時の処理
    chrTX.addEventListener('characteristicvaluechanged', onReceived);
    chrTX.startNotifications();
    // 画面表示切替
    text_rx.value = '';
    text_tx.value = '';
    panel_connect.style.display = "none";
    panel_main.style.display = "block";

  } catch (error) {
    console.log("ERROR! " + error);
    bleDevice = null;
  }
});

// 「送信」ボタン
btn_send.addEventListener('click', function () {
  const text = text_tx.value;
  const encoder = new TextEncoder();
  const byteArray = encoder.encode(text);
  //text_tx.value = '';
  chrRX.writeValue(byteArray).then(() => {
    console.log('send:' + text);
  });
});

// 「クリア」ボタン
btn_clear.addEventListener('click', function () {
  text_rx.value = '';
  console.log('clear');
});

// 「切断」ボタン
btn_disconnect.addEventListener('click', function (){
  if(bleDevice != null){
    bleDevice.gatt.disconnect();
  }
});

/********** BLEのイベントハンドラ ***********/
// 切断時
function onDisconnected(event) {
  const device = event.target;
  console.log(`Device ${device.name} is disconnected.`);
  bleDevice = null;
  // 画面表示切替
  text_connect.innerText = "";
  panel_main.style.display = "none";
  panel_connect.style.display = "block";
}

// 受信時
function onReceived(event) {
  const characteristic = event.target;
  const value = characteristic.value;
  const decoder = new TextDecoder();
  const text = decoder.decode(value);
  text_rx.value += text;
}