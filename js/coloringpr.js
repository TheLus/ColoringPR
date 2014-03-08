{
  var PULL_REQUEST = "pull";

  document.onLoad = start();
  document.onclick = start();

  function start() {
    setTimeout(function () {
      var state = checkURL(document.URL);
      switch(state) {
        case PULL_REQUEST:
          console.log("pull_req");
          changeBGColor();
          break;
        default :
          console.log("default");
          break;
      }
    }, 500);
  }

  function changeBGColor() {
    console.log("changeBGColor");
    $(".commit").css("background", "skyblue");
  }
  function checkURL(url) {
    return url.split("/")[5];
  }
}
