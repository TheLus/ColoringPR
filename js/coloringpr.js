{
  var PULL_REQUEST = "pull";
  var prMap = JSON.parse(localStorage['prMap']);
  //var prMap = {}; //TODO テスト用の初期化. 最後に消す
  var prMapper = new PRMapper(prMap);

  /**
   * プルリクエストとコミットのマッピングを行うクラス
   * ついでに背景色の変更なども行う
   */
  function PRMapper(prMap) {
    this.prMap = prMap;
    this.isReady = false;

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
    var url      = document.URL;
    var pageType = getPageType(url);
    var pageNum  = getPageNum(url);

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
        $.getJSON(commits_url, $.proxy(function (json) {
          console.log(json);
          this.onGetCommits(json, prNum);
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
  PRMapper.prototype.onGetCommits = function (commits, prNum) {
    var commitsLength = commits.length;

    if (commitsLength === prMap[prNum]) {
      return;
    }
    prMap[prNum] = commitsLength;

    for (var i = 0; i < commitsLength; i++) {
      var commitId = commits[i].sha;
      // 新規登録 or コミット数のより少ないプルリクを優先してマッピング
      if ( !(commitId in prMap) || prMap[prNum] < prMap[prMap[commitId]] ) {
        prMap[commitId] = prNum;
      }
    }
    localStorage['prMap'] = JSON.stringify(prMap);
    $(this).trigger("update");
  };

  /**
   * コミットの背景色をプルリクごとに異なった色にする
   * おまけでクリックしたときにプルルクごとにまとめる機能をつける
   */
  PRMapper.prototype.coloring = function () {
    var $commits = $(".commit");
    var pageNum = getPageNum(document.URL);
    var commitsLength = $commits.length;
    var prCounter = {"undefined": 0};

    for (var i = 0; i < commitsLength; i++) {
      var prNum = this.prMap[this.getCommitId($commits[i])];
      if ((prNum + "") === pageNum) {
        continue;
      }

      if ( !(prNum in prCounter) ) {
        prCounter[prNum] = Object.keys(prCounter).length;
      }
      var colorCode = getColorCode(prCounter[prNum]);
      $commits[i].style.background = colorCode;
      $commits[i].title = "PR #" + prNum;
      if ( prCounter[prNum] === 0 ) {
        continue;
      }
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
    var $commits = $(".commit");
    var commitsLength = $commits.length;
    if (commitsLength <= 1) {
      return;
    }

    if ($commits.eq(1).css('display') === "none") {
      $commits.show();
    } else {
      $commits.hide();
      $commits.eq(0).show();
    }
  }

  prMapper.start();

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
