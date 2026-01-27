const params = new URLSearchParams(window.location.search);
const imgUrl = params.get("img");

const CAPTION = `
☕ Coffee moment at 3 Bears Cafe
📸 Mirror Booth

#3BearsCafe #CoffeeMoment #CafeLife
`;

document.getElementById("photo").src = imgUrl;

function download() {
  const a = document.createElement("a");
  a.href = imgUrl;
  a.download = "3-bears-cafe.jpg";
  a.click();
}

function openIG() {
  window.open("https://www.instagram.com/", "_blank");
}

function openFB() {
  window.open("https://www.facebook.com/", "_blank");
}

function copyCaption() {
  navigator.clipboard.writeText(CAPTION);
  alert("Caption copied! Paste it on Instagram or Facebook.");
}