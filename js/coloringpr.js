{
  var PULL_REQUEST = "pull";
  var $ = jQuery;
  if(localStorage['githubData']) {
    var githubData = JSON.parse(localStorage['githubData']);
  } else {
    var githubData = {};
  }
  var prMapper = new PRMapper(githubData);

  /**
   * プルリクエストとコミットのマッピングを行うクラス
   * ついでに背景色の変更なども行う
   */
  function PRMapper(githubData) {
    this.githubData = githubData;
    this.isReady = false;
    this.currentPageNum = null;

    $(this).on("update", function () {
      if (this.isReady) {
        this.coloring();
      }
    });
  }

  /**
   * 全てのプルリクを参照し、コミットとプルリクのマップを作成する
   * ことを開始する。
   */
  PRMapper.prototype.start = function () {
    var url             = document.URL;
    var pageType        = getPageType(url);
    var repos           = getRepos(url);
    this.currentPageNum = getPageNum(url);
    if (repos in this.githubData) {
      this.prMap = this.githubData[repos];
    } else {
      this.prMap = {};
      this.githubData[repos] = this.prMap;
    }

    switch(pageType) {
      case PULL_REQUEST:
        // 現在開いているページがプルリクエストページならば
        // 全てのプルリクエストを参照しにいく
        this.crawlPullRequest(url);
        break;
      default :
        break;
    }
  };

  /**
   * プルリクエスト情報を得るためのURLを作成し、
   * リクエストを投げる
   * @param url リポジトリ情報とユーザ情報を含んだURL
   */
  PRMapper.prototype.crawlPullRequest = function (url) {
    var usr = getUsr(url);
    var repos = getRepos(url);
    var requestUrl = "https://api.github.com/repos/" + usr + "/" + repos + "/pulls";

    $.getJSON(requestUrl + "?state=all", $.proxy(function (json) {
      this.onGetPRs(json);
    }, this));
  };

  /**
   * プルリクエストの情報からコミットを取得しにいく
   * @param prs プルリクエストの情報をもつJSONデータ
   */
  PRMapper.prototype.onGetPRs = function (prs) {
    var prsLength = prs.length;

    for (var i = 0; i < prsLength; i++) {
      ($.proxy(function () {
        var commits_url = prs[i].commits_url;
        var prNum = commits_url.split("/")[7];
        var prName = prs[i].title;
        $.getJSON(commits_url, $.proxy(function (json) {
          console.log(json);
          this.onGetCommits(json, prNum, prName);
        }, this));
      }, this))();
    }
  };

  /**
   * コミット情報とプルリク番号を受け取り
   * マッピングする
   * @param commits コミットの情報を持つJSONデータ
   * @param prNum プルリクエスト番号
   */
  PRMapper.prototype.onGetCommits = function (commits, prNum, prName) {
    var commitsLength = commits.length;

    if (!this.prMap[prNum]) {
      this.prMap[prNum] = {};
    }
    if (commitsLength === this.prMap[prNum].commitsLength) {
      return;
    }
    this.prMap[prNum].commitsLength = commitsLength;
    this.prMap[prNum].name = prName;

    for (var i = 0; i < commitsLength; i++) {
      var commitId = commits[i].sha;
      // 新規登録 or コミット数のより少ないプルリクを優先してマッピング
      if ( !(commitId in this.prMap) || this.prMap[prNum].commitsLength < this.prMap[this.prMap[commitId]].commitsLength ) {
        this.prMap[commitId] = prNum;
      }
    }

    localStorage['githubData'] = JSON.stringify(this.githubData);
    $(this).trigger("update");
  };

  /**
   * コミットの背景色をプルリクごとに異なった色にする
   * おまけでクリックしたときにプルルクごとにまとめる機能をつける
   */
  PRMapper.prototype.coloring = function () {
    var $commits = $(".commit");
    var commitsLength = $commits.length;
    var prCounter = {"undefined": 0};

    for (var i = 0; i < commitsLength; i++) {
      var prNum = this.prMap[this.getCommitId($commits[i])];
      if ((prNum + "") === this.currentPageNum) {
        continue;
      }

      if ( !(prNum in prCounter) ) {
        prCounter[prNum] = Object.keys(prCounter).length;
      }
      var colorCode = getColorCode(prCounter[prNum]);
      $commits[i].style.background = colorCode;
      if ( prCounter[prNum] === 0 ) {
        continue;
      }
      $commits[i].title = "PR #" + prNum;
      $($commits[i]).off("click");
      $($commits[i]).on("click", $.proxy(function () {
        this.toggleView();
      }, this));
    }
  }

  /**
   * コミットのIDを取得する
   * @param commit commitエレメント
   */
  PRMapper.prototype.getCommitId = function (commit) {
    return commit.getAttribute("data-channel").split("commit:")[1];
  }

  /**
   * プルリクエストにまとめて表示する
   * すでにプルリクエストにまとめて表示されていたら、
   * コミットに分けて表示する
   */
  PRMapper.prototype.toggleView = function () {
    var $commits = $(".commit[title]");
    var commitsLength = Math.floor($commits.length/2);
    var prCounter = {};
    var checkId = 0;
    if (commitsLength <= 1) {
      return;
    }

    for (var i = 0; i < commitsLength; i++) {
      var prNum = $commits.eq(i).attr('title').split("#")[1];
      if ( !(prNum in prCounter) ) {
        prCounter[prNum] = i;
        continue;
      }
      checkId = i;
    }
    var prNums = Object.keys(prCounter);
    var prCounterLength = prNums.length;
    if ($commits.eq(checkId).css('display') === "none") {
      $commits.show();
      for (var i = 0; i < prCounterLength; i++) {
        setCode2Commit($commits.eq(prCounter[prNums[i]]).find("code"));
        setCode2Commit($commits.eq(prCounter[prNums[i]] + commitsLength).find("code"));
      }
    } else {
      $commits.hide();
      for (var i = 0; i < prCounterLength; i++) {
        var prTitle = this.prMap[prNums[i]].name;
        var prNum = "PR #" + prNums[i];
        var prLink = location.href.split("/pull/")[0] + "/pull/" + prNums[i];
        $commits.eq(prCounter[prNums[i]]).show();
        setCode2PR($commits.eq(prCounter[prNums[i]]).find("code"), prTitle, prNum, prLink);
        $commits.eq(prCounter[prNums[i]] + commitsLength).show();
        setCode2PR($commits.eq(prCounter[prNums[i]] + commitsLength).find("code"), prTitle, prNum, prLink);
      }
    }
  }

  prMapper.start();

  function setCode2Commit(code) {
    code[0].innerHTML = code[0].tmpHTML;
    code[1].innerHTML = code[1].tmpHTML;
  }

  function setCode2PR(code, prTitle, prNum, prLink) {
    var atag = code.find("a");
    code[0].tmpHTML = code[0].innerHTML;
    code[1].tmpHTML = code[1].innerHTML;
    atag.eq(0).text(prTitle);
    atag.eq(1).text(prNum);
    atag.attr("href", prLink);
    atag.attr("target", "_brank");
  }

  /**
   * いい感じにカラーコードを返す関数
   * 50まではいい感じ返す、50より上はランダム
   * ex) getColorCode(2) -> #fdf
   *     getColorCode(7) -> #ddd
   *     getcolorcode(8) -> #ddb
   */
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
