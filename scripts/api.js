var apiKey = 'cc458f6bcd11d2f1';
var apiReturnType = 'json';
var baseRequestUrl = 'http://chenapp.com/';
var apiRequestUrl = baseRequestUrl + 'api2?apikey=' + apiKey + '&format=' + apiReturnType + '&v=1.8.2';
var notificationIcon = 'http://res.chenapp.com/images/remind_icon_48.png';
var db = openDatabase("NotePad_1_8_0", "1.0", "Notebook DB", 20 * 1024 * 1024);

/* 初始化localStorage */
function initLocalStorage() {
    var tempUsername = localStorage.username;
	localStorage.clear();
	localStorage.username = tempUsername ? tempUsername : '';
	localStorage.password = '';
	localStorage.select = 0;
	localStorage.lastSection = 'login';
	localStorage.isLogin = 'false';
	localStorage.sessionId = '';
    localStorage.isVip = 0;
    localStorage.isFirst = 'false';
    localStorage.lastUpdateTime = 0;
    db.transaction(function(tx) {
        tx.executeSql("DROP TABLE notebook", [], function(){
            console.log("DROPTable2");
        }, function(tx, error){
            console.log(error);
        });
        tx.executeSql("CREATE TABLE notebook (id, title, content, updateTime, sort, isSync)", [], function(){
            console.log("CreateTable2");
        }, function(tx, error){
            console.log(error);
        });
    });
}

/* 获取Sid请求 */
function userGetSessionId(username, password) {
    var rsa = username + ',' + password;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=user.getSessionId',
        data: {rsa:rsa},
        dataType: 'json'
    });
}

/* 用户注册请求 */
function userRegister(username, password, email, mobile) {
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=user.register',
        data: {username:username, password:password, email:email, mobile:mobile},
        dataType: 'json'
    });
}

/* 获取一条通知信息 */
function noticeGet() {
    if(localStorage.isLogin == 'false') {
        return false;
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=user.getNotice&sessionId=' + sessionId,
        dataType: 'json'
    });
}

/* 获取所有记事本内容请求 */
function noteGetList() {
    if(localStorage.isLogin == 'false') {
        return false;
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=note.getList&sessionId=' + sessionId,
        dataType: 'json'
    });
}

/* 获取一条记事本内容请求 */
function noteGetOne() {
    if(localStorage.isLogin == 'false') {
        return false;
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=note.getOne&sessionId=' + sessionId,
        data: {id:id},
        dataType: 'json'
    });
}

/* 添加记事本内容请求 */
function noteAddOne(content, title) {
    if(localStorage.isLogin == 'false') {
        //生成id
        var id = localStorage.primary_id || 0;
        localStorage.primary_id = parseInt(id) + 1;
        var timestamp = Date.parse(new Date())/1000;
        return {'errorCode': 0, "result": {'id': localStorage.primary_id,'updateTime': timestamp}};
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=note.addOne&sessionId=' + sessionId,
        data: {content:content, title:title},
        dataType: 'json'
    });
}

/* 删除记事本内容请求 */
function noteDeleteOne(id) {
    if(localStorage.isLogin == 'false') {
        return {"errorCode": 0};
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=note.deleteOne&sessionId=' + sessionId,
        data: {id:id},
        dataType: 'json'
    });
}

/* 更新记事本内容请求 */
function noteUpdateOne(id, content, title, updateTime, sort) {
    if(localStorage.isLogin == 'false') {
        return false;
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=note.updateOne&sessionId=' + sessionId,
        data: {id:id, content:content, title:title, updateTime:updateTime, sort:sort},
        dataType: 'json'
    });
}

/* 栓查更新并获取更新的记事本内容 */
function noteCheckUpdate(postData) {
    if(localStorage.isLogin == 'false') {
        return false;
    }
    var sessionId = localStorage.sessionId;
    return $.ajax({
        type: "POST",
        url: apiRequestUrl + '&method=note.checkUpdate&sessionId=' + sessionId,
        data: {postData:postData},
        dataType: 'json'
    });
}

/* update ContextMenu*/
function updateAllContextMenu(){
	var background = chrome.extension.getBackgroundPage();
	background.updateAllContextMenu();
}