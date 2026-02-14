let isUploading = false;

// PRELOAD FRAME IMAGE (LOAD ONCE)
const frameImage = new Image();
frameImage.src = "frame.png";

const idleScreen = document.getElementById("idleScreen");
const startBtn = document.getElementById("startBtn");

const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const captureBtn = document.getElementById("captureBtn");
const countdownEl = document.getElementById("countdown");

const preview = document.getElementById("preview");
const photoPreview = document.getElementById("photoPreview");
const confirmBtn = document.getElementById("confirmBtn");
const retakeBtn = document.getElementById("retakeBtn");

let stream;

// CAMERA INIT
async function startCamera() {
    if (stream) return;  // 👈 prevent double camera start
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });
  video.srcObject = stream;
}

startBtn.addEventListener("click", async () => {
  idleScreen.style.display = "none";
  video.style.display = "block";   // 👈 show camera
  await startCamera();
});




// COUNTDOWN
function startCountdown(seconds = 3) {
  if (captureBtn.disabled) return;

  captureBtn.disabled = true;
  countdownEl.classList.remove("hidden");

  let count = seconds;
  countdownEl.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count === 0) {
      clearInterval(interval);
      countdownEl.classList.add("hidden");
      capturePhoto();
    } else {
      countdownEl.textContent = count;
    }
  }, 1000);
}

// CAPTURE
function capturePhoto() {
  const FRAME_WIDTH = 1080;
  const FRAME_HEIGHT = 1350;

  canvas.width = FRAME_WIDTH;
  canvas.height = FRAME_HEIGHT;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ---- Adjust these to match your transparent window ----
  const photoX = 90;
  const photoY = 300;
  const photoWidth = 900;
  const photoHeight = 720;

  // Auto crop & fill window properly
const videoRatio = video.videoWidth / video.videoHeight;
const frameRatio = photoWidth / photoHeight;

let drawWidth, drawHeight;

if (videoRatio > frameRatio) {
  drawHeight = photoHeight;
  drawWidth = drawHeight * videoRatio;
} else {
  drawWidth = photoWidth;
  drawHeight = drawWidth / videoRatio;
}

const offsetX = photoX - (drawWidth - photoWidth) / 2;
const offsetY = photoY - (drawHeight - photoHeight) / 2;

ctx.save();
ctx.scale(-1, 1);
ctx.drawImage(
  video,
  -offsetX - drawWidth,
  offsetY,
  drawWidth,
  drawHeight
);
ctx.restore();

  // Draw frame overlay (already loaded)
  ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

  const imageData = canvas.toDataURL("image/jpeg", 0.95);
  photoPreview.src = imageData;

  confirmBtn.disabled = false;
  confirmBtn.textContent = "Looks Good";

  preview.classList.remove("hidden");
  video.style.display = "none";
}

// EVENTS
captureBtn.addEventListener("click", () => startCountdown());

retakeBtn.addEventListener("click", () => {
preview.classList.add("hidden");
  video.style.display = "block";
  captureBtn.disabled = false;
});

confirmBtn.addEventListener("click", async () => {
  if (isUploading) return;        // ⛔ block double click
  isUploading = true;

  confirmBtn.disabled = true;
  confirmBtn.textContent = "Saving...";

  try {
    const imageData = photoPreview.src;
    const url = await uploadPhoto(imageData);

    console.log("Saved photo URL:", url);

    // reset state
    isUploading = false;
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Looks Good";

    preview.classList.add("hidden");
    video.style.display = "block";
    captureBtn.disabled = false;

    showQR(url);
  } catch (err) {
    console.error(err);
    isUploading = false;
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Looks Good";
    alert("Upload failed. Please try again.");
  }
});

async function uploadPhoto(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", "mirror_booth");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dmz0nvnk8/image/upload",
    {
      method: "POST",
      body: formData
    }
  );

if (!res.ok) {
  const errorText = await res.text();
  console.error("Cloudinary error:", errorText);
  throw new Error(errorText);
}

  const data = await res.json();
  return data.secure_url; // ✅ public CDN image
}

const qrOverlay = document.createElement("div");
qrOverlay.id = "qrOverlay";
qrOverlay.className = "hidden";
qrOverlay.innerHTML = `
  <div class="qr-box">
    <h2>Scan to get your photo 📸</h2>
    <div id="qrCode"></div>
    <p>3 Bears Cafe</p>
  </div>
`;
document.body.appendChild(qrOverlay);

function showQR(photoUrl) {
  const shareUrl =
    "https://tyrielleiryt.github.io/3-Bears-Mirror-Booth/photo.html?img=" +
    encodeURIComponent(photoUrl);
    
  document.getElementById("qrCode").innerHTML = "";
  new QRCode(document.getElementById("qrCode"), shareUrl);
preview.classList.add("hidden");
  video.style.display = "none"; // 🔑 hide camera
  qrOverlay.classList.remove("hidden");

setTimeout(() => {
  qrOverlay.classList.add("hidden");

  // 🔴 Stop camera stream completely
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.style.display = "none";
  idleScreen.style.display = "flex";
}, 30000);
  
}