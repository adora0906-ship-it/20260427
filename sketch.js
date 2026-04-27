// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let startButton;
let isStarted = false;
let bubbles = []; // 儲存水泡的陣列

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log("當前手部偵測資料：", hands);
}

function gotHands(results) {
  // 將偵測結果存入 hands 變數
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 設定影片尺寸，確保偵測座標時有正確的基準點
  // 加入 constraints 確保在手機上使用前鏡頭並修正 iOS 播放問題
  let constraints = {
    video: { facingMode: "user" },
    audio: false
  };
  video = createCapture(constraints);
  video.size(640, 480);
  video.elt.setAttribute('playsinline', ''); // 關鍵：防止 iOS 強制全螢幕播放
  video.hide();

  // 建立啟動按鈕，解決手機端必須由使用者點擊才能啟動媒體的問題
  startButton = createButton('點擊以啟動相機偵測');
  startButton.style('padding', '20px');
  startButton.style('font-size', '18px');
  startButton.position(windowWidth / 2 - 80, windowHeight / 2);
  startButton.mousePressed(startDetection);
}

function startDetection() {
  // 檢查是否為安全環境 (HTTPS 或 localhost)
  // 注意：在手機上若使用 http://192.168... 則 window.isSecureContext 會是 false
  if (window.isSecureContext || window.location.hostname === "localhost") {
    isStarted = true;
    startButton.hide();
    video.play(); // 強制觸發影片播放，解決行動裝置自動播放限制
    // Start detecting hands
    handPose.detectStart(video, gotHands);
  } else {
    alert("【偵測失敗】手機端必須使用 HTTPS 網址才能開啟相機。\n目前網址為: " + window.location.protocol + "\n建議部署至 GitHub Pages 或使用 ngrok。");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (startButton) {
    startButton.position(windowWidth / 2 - 80, windowHeight / 2);
  }
}

function draw() {
  background('#e7c6ff');

  if (!isStarted) {
    fill(0);
    textAlign(CENTER);
    textSize(20);
    text("等待啟動...", width / 2, height / 2 - 40);
    return;
  }

  // 計算影像顯示的大小（全螢幕的 50%）與置中位置
  let w = width * 0.5;
  let h = height * 0.5;
  let x = (width - w) / 2;
  let y = (height - h) / 2;

  // 在畫布上方加上置中文字 (搬移到檢查影片之前，確保啟動後優先顯示)
  push(); // 使用 push/pop 確保樣式設定不干擾其他繪製
  stroke(255);      // 設定白色外框
  strokeWeight(3);  // 設定外框粗細
  textAlign(CENTER, CENTER);
  textSize(40);
  textFont('Arial');

  let txt = "414730324 吳采璇";
  let tw = textWidth(txt); // 取得文字寬度
  let th = 40;             // 文字高度（與 textSize 相同）
  let tx = width / 2;
  let ty = y / 2;

  // 檢查滑鼠座標是否在文字範圍內
  if (mouseX > tx - tw/2 && mouseX < tx + tw/2 && mouseY > ty - th/2 && mouseY < ty + th/2) {
    fill('#ff0055'); // 滑鼠移上去時變成桃紅色
  } else {
    fill(0);         // 預設為黑色
  }

  // 將文字移動到影像上方區域的中心點
  text(txt, tx, ty);
  pop();

  // 檢查影片串流是否已經可以播放 (readyState >= 2)
  if (video.elt.readyState < 2) {
    return;
  }

  translate(x + w, y); // 移動到顯示區域的右側
  scale(-1, 1);       // 水平反轉
  image(video, 0, 0, w, h);

  // Ensure at least one hand is detected
  if (hands && hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1 && hand.keypoints) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          let px = map(keypoint.x, 0, video.width, x, x + w);
          let py = map(keypoint.y, 0, video.height, y, y + h);
          circle(px, py, 16);

          // 針對編號 4, 8, 12, 16, 20 的關鍵點產生水泡
          if ([4, 8, 12, 16, 20].includes(i)) {
            if (frameCount % 2 === 0) { // 控制水泡產生頻率
              bubbles.push({
                x: px,
                y: py,
                size: random(10, 25),
                speed: random(2, 5),
                alpha: 255
              });
            }
          }
        }
        // 串接關鍵點連線
        strokeWeight(5); // 設定線條粗細
        if (hand.handedness == "Left") {
          stroke(255, 0, 255); // 左手紫色
        } else {
          stroke(255, 255, 0); // 右手黃色
        }

        // 定義手指連線組：0-4(拇指), 5-8(食指), 9-12(中指), 13-16(無名指), 17-20(小指)
        let fingerParts = [
          [0, 1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
          [17, 18, 19, 20]
        ];

        for (let part of fingerParts) {
          for (let i = 0; i < part.length - 1; i++) {
            let p1 = hand.keypoints[part[i]];
            let p2 = hand.keypoints[part[i + 1]];
            
            // 映射連線起點與終點座標
            let x1 = map(p1.x, 0, video.width, x, x + w);
            let y1 = map(p1.y, 0, video.height, y, y + h);
            let x2 = map(p2.x, 0, video.width, x, x + w);
            let y2 = map(p2.y, 0, video.height, y, y + h);
            
            line(x1, y1, x2, y2);
          }
        }
      }
    }
  }

  // 更新並繪製水泡
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.y -= b.speed; // 向上漂浮
    b.alpha -= 3;   // 逐漸透明
    
    stroke(255, b.alpha);
    strokeWeight(2);
    noFill();
    circle(b.x, b.y, b.size);

    // 當水泡透明度降為 0 或飄出畫布時「破掉」 (移除)
    if (b.alpha <= 0 || b.y < 0) {
      bubbles.splice(i, 1);
    }
  }
}
