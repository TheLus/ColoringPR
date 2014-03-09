{
  var PULL_REQUEST = "pull";
  var prMap = JSON.parse(localStorage['prMap']);
  var prMap = {}; //TODO テスト用の初期化. 最後に消す
  var prMapper = new PRMapper(prMap);

  function PRMapper(prMap) {
    this.prMap = prMap;
    this.isReady = false;

    $(this).on("update", function () {
      if (this.isReady) {
        this.coloring();
      }
    });
  }

  PRMapper.prototype.start = function () {
    var url = document.URL;
    var pageType = getPageType(url);
    var pageNum = getPageNum(url);

    switch(pageType) {
      case PULL_REQUEST:
        console.log("pull_req");
        this.onOpenPullRequestPage(url);
        this.coloring(this.prMap);
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
    console.log(prNum);
    for (var i = 0; i < commitsLength; i++) {
      if ( !(commits[i].sha in prMap) || prMap[prNum] < prMap[prMap[commits[i].sha]] ) {
        prMap[commits[i].sha] = prNum;
      }
    }
    localStorage['prMap'] = JSON.stringify(prMap);
    $(this).trigger("update");
  };

  PRMapper.prototype.coloring = function () {
    var $commits = $(".commit");
    var pageNum = getPageNum(document.URL);
    var commitsLength = $commits.length;
    var prCounter = {"undefined": 0};

    for (var i = 0; i < commitsLength; i++) {
      var prNum = this.prMap[this.getCommitId($commits[i])];
      if ((prNum + "") !== pageNum) {
        if ( !(prNum in prCounter) ) {
          prCounter[prNum] = Object.keys(prCounter).length;
        }
        var colorCode = getColorCode(prCounter[prNum]);
        $commits[i].style.background = colorCode;
      }
    }
  }

  PRMapper.prototype.getCommitId = function (commit) {
    return commit.getAttribute("data-channel").split("commit:")[1];
  }
  prMapper.start();

  function getColorCode(num) {
    if (num > 50) {
      return getColorCode(Math.floor(Math.random()*50));
    }
    var preCode = ("" + (parseInt((num%7).toString(2)) + Math.floor(num/7)*111)).split('');
    while (preCode.length < 3) {
      preCode.unshift('0');
    }
    var colorCode = "";
    for (var i = 0; i < 3; i++) {
      colorCode += (15 - parseInt(preCode[i], 16)*2).toString(16);
    }
    return "#" + colorCode;
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

  $(document).ready(function () {
    prMapper.isReady = true;
    prMapper.coloring();
  });
}
