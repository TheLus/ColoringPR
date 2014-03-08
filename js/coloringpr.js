{
  var PULL_REQUEST = "pull";

  document.onLoad = start();
  document.onclick = start();

  function start() {
    setTimeout(function () {
      var pageType = getPageType(document.URL);
      var pageNum = getPageNum(document.URL);

      switch(pageType) {
        case PULL_REQUEST:
          console.log("pull_req");
          onOpenPullRequestPage();
          break;
        default :
          console.log("default");
          break;
      }
    }, 500);
  }

  function onOpenPullRequestPage() {
    console.log("onOpenPullRequestPage");
  }

  function changeBGColor() {
    console.log("changeBGColor");
    $(".commit").css("background", "skyblue");
  }
  function getPageType(url) {
    return url.split("/")[5];
  }
  function getPageNum(url) {
    return url.split("/")[6];
  }
}
