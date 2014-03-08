{
  var PULL_REQUEST = "pull";
  var prMap = new PRMap();

  document.onLoad = start();

  function start() {
    setTimeout(function () {
      var url = document.URL;
      var pageType = getPageType(url);
      var pageNum = getPageNum(url);

      switch(pageType) {
        case PULL_REQUEST:
          console.log("pull_req");
          onOpenPullRequestPage(url);
          break;
        default :
          console.log("default");
          break;
      }
    }, 500);
  }

  function onOpenPullRequestPage(url) {
    var usr = getUsr(url);
    var repos = getRepos(url);
    var pageNum = getPageNum(url);
    var requestUrl = "https://api.github.com/repos/" + usr + "/" + repos + "/pulls";

    $.getJSON(requestUrl + "?state=all", function (json) {
      onGetPRs(json, requestUrl, pageNum);
    });
  }

  function onGetPRs(prs, url, pageNum) {
    var prsLength = prs.length;
    for (var i = 0; i < prsLength; i++) {
      (function () {
        var prNum = i+1;
        $.getJSON(url + "/" + prNum + "/commits", function (json) {
          onGetCommits(json, prNum);
        });
      })();
    }
  }

  function onGetCommits(json, prNum) {
    var commits = json;
    var commitsLength = commits.length;
    for (var i = 0; i < commitsLength; i++) {
      prMap.addCommit(commits[i].sha, prNum);
    }
    console.log(prMap);
  }

  function changeBGColor() {
    console.log("changeBGColor");
    $(".commit").css("background", "skyblue");
  }
  function getUsr(url) {
    return url.split("/")[3];
  }
  function getRepos(url) {
    return url.split("/")[4];
  }
  function getPageType(url) {
    return url.split("/")[5];
  }
  function getPageNum(url) {
    return url.split("/")[6];
  }

  function PRMap() {
  }
  PRMap.prototype.addCommit = function (commitId, prId) {
    this["" + commitId] = prId;
  }

}
