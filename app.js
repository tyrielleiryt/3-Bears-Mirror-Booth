// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyBmpn8Q_cPQ-h5Bn4IVVZzehYAplVySklE",
  authDomain: "bears-mirror-booth.firebaseapp.com",
  projectId: "bears-mirror-booth",
  storageBucket: "bears-mirror-booth.firebasestorage.app",
  messagingSenderId: "257786727773",
  appId: "1:257786727773:web:78f2d949a8d7beb5422cb4"
};

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();
const db = firebase.firestore();

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
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });
  video.srcObject = stream;
}

startCamera();



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
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();
  ctx.scale(-1, 1);
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  // Branding
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
  ctx.fillStyle = "white";
  ctx.font = "30px sans-serif";
  ctx.fillText("☕ Your Coffee Shop", 20, canvas.height - 20);

  const imageData = canvas.toDataURL("image/jpeg", 0.85);
  photoPreview.src = imageData;

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
  confirmBtn.disabled = true;
  confirmBtn.textContent = "Saving...";

  try {
    const imageData = photoPreview.src;
    const url = await uploadPhoto(imageData);

console.log("Saved photo URL:", url);

// Reset button FIRST
confirmBtn.disabled = false;
confirmBtn.textContent = "Looks Good";

// Hide preview & reset camera
preview.classList.add("hidden");
video.style.display = "block";
captureBtn.disabled = false;

    // NEXT: QR & Share screen (MODULE 4)
  } catch (err) {
    alert("Upload failed. Please try again.");
    console.error(err);
  }
});

async function uploadPhoto(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const timestamp = Date.now();
  const filename = `photos/${timestamp}.jpg`;

  const storageRef = storage.ref().child(filename);

  await storageRef.put(blob, {
    contentType: "image/jpeg"
  });

  const rawUrl = await storageRef.getDownloadURL();

// Force classic Firebase domain (fixes broken image rendering)
const downloadURL = rawUrl.replace(
  "firebasestorage.app",
  "firebasestorage.googleapis.com"
);

  await db.collection("photos").add({
    url: downloadURL,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  return downloadURL;
}