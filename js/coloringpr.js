{
  var PULL_REQUEST = "pull";
  //var prMap = JSON.parse(localStorage['prMap']);
  var prMap = {};
  var prMapper = new PRMapper(prMap);


  function PRMapper(prMap) {
    this.prMap = prMap;
  }

  PRMapper.prototype.start = function () {
      var url = document.URL;
      var pageType = getPageType(url);
      var pageNum = getPageNum(url);

      switch(pageType) {
        case PULL_REQUEST:
          console.log("pull_req");
          this.onOpenPullRequestPage(url);
          break;
        default :
          console.log("default");
          break;
      }
  };

  PRMapper.prototype.onOpenPullRequestPage = function (url) {
    var usr = getUsr(url);
    var repos = getRepos(url);
    var pageNum = getPageNum(url);
    var requestUrl = "https://api.github.com/repos/" + usr + "/" + repos + "/pulls";

    $.getJSON(requestUrl + "?state=all", $.proxy(function (json) {
      this.onGetPRs(json, requestUrl, pageNum);
    }, this));
  };

  PRMapper.prototype.onGetPRs = function (prs, url, pageNum) {
    var prsLength = prs.length;

    for (var i = 0; i < prsLength; i++) {
      ($.proxy(function () {
        var prNum = i+1;
        $.getJSON(url + "/" + prNum + "/commits", $.proxy(function (json) {
          this.onGetCommits(json, prNum);
        }, this));
      }, this))();
    }
  };

  PRMapper.prototype.onGetCommits = function (commits, prNum) {
    var commitsLength = commits.length;

    if (commitsLength === prMap[prNum])
      return;

    prMap[prNum] = commitsLength;
    for (var i = 0; i < commitsLength; i++) {
      prMap["" + commits[i].sha] = prNum;
    }
    localStorage['prMap'] = JSON.stringify(prMap);
    $(this).trigger("testes");
    console.log(prMap);
  };

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

  $(document).ready(function () {
    prMapper.start();
  });
}
