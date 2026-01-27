// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyBmpn8Q_cPQ-h5Bn4IVVZzehYAplVySklE",
  authDomain: "bears-mirror-booth1.firebaseapp.com",
  projectId: "bears-mirror-booth1",
  storageBucket: "bears-mirror-booth1.appspot.com",
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


  // ✅ RESET CONFIRM BUTTON HERE (CRITICAL)
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
    // === MODULE 4: QR SCREEN ===
showQR(url);
  } 
  
  
  catch (err) {
    alert("Upload failed. Please try again.");
    console.error(err);
  }
});

async function uploadPhoto(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();

    if (blob.size > 5 * 1024 * 1024) {
      throw new Error("Image too large");
    }

    const timestamp = Date.now();
    const filename = `photos/${timestamp}.jpg`;
    const storageRef = storage.ref().child(filename);

    await storageRef.put(blob, {
      contentType: "image/jpeg"
    });

    const rawUrl = await storageRef.getDownloadURL();

    const downloadURL = rawUrl.replace(
      "firebasestorage.app",
      "firebasestorage.googleapis.com"
    );

    // Firestore in background
    db.collection("photos")
      .add({
        url: downloadURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .catch(console.error);

    return downloadURL;
  } catch (err) {
    console.error("UPLOAD FAILED:", err);
    throw err;
  }
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
    video.style.display = "block"; // 🔑 restore camera
  }, 30000);
  
}