{
  var PULL_REQUEST = "pull";

  document.onLoad = start();
  document.onclick = function () {
    start();
  }
  function start() {
    setTimeout(function () {
      var state = checkURL(document.URL);
      switch(state) {
      case PULL_REQUEST
        console.log("pull_req");
        break;
      default:
        console.log("default");
        break;
      }, 500);
  }

  function changeBGColor() {
    $(".commit").css("background", "skyblue");
    console.log("foo");
  }
  function checkURL(url) {
    return url.split("/")[5];
  }
}
