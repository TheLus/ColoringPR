document.onLoad = start();
document.onclick = function () {
  start();
}
function start() {
  setTimeout(changeBGColor, 300);
}
function changeBGColor() {
  $(".commit").css("background", "skyblue");
  console.log("foo");
}
