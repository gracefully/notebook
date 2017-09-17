/* 检查记事本内容是否有更新 */
var checkUpdateAll = function(fn, error) {
    //console.log('同步内容到本地操作');
    db.transaction(function(tx){
        tx.executeSql('select * from notebook order by sort desc', [], function(tx, data){
            var temp;
            var postData = '';
            var dot = '';
            for (var i=0; i<data.rows.length; i++) {
                temp = data.rows.item(i);
                postData += dot+temp['id']+','+temp['updateTime'];
                dot = '|';
            }
            $.when(noteCheckUpdate(postData)).done(function(data){
                if(data.errorCode > 0) {
                    if (data.errorCode ==2) {
                        resetSesssionId(function(){
                            checkUpdateAll(function(){}, function(){});
                        });
                    }
                    error(data.errorCode);
                } else {
                    if(data.result.length > 0) {
                        var d = {};
                        db.transaction(function(tx) {
                            for (var i=0; i<data.result.length; i++) {
                                d = data.result[i];
                                if(d.type == 'insert') {
                                    tx.executeSql("INSERT INTO notebook (id, title, content, updateTime, sort, isSync) values(?, ?, ?, ?, ?, ?)",
                                        [d.id, d.title, d.content, d.updateTime, d.sort, 1], null, null);
                                } else if(d.type == 'delete') {
                                    tx.executeSql("DELETE from notebook WHERE id=?", [d.id], null, null);
                                } else {
                                    tx.executeSql("UPDATE notebook SET title=?, content=?, updateTime=?, sort=? WHERE id=?", [d.title, d.content, d.updateTime, d.sort, d.id], null, null);
                                }
                            }
                        });
                    }
                    fn();
                }
            });
        }, function(tx, error) {
            error(10000);
        });
    });
};

/* 记事本内容更新到服务器 */
var noteUpdateAll = function(fn, error){
    //console.log('同步内容到服务器操作');
    db.transaction(function(tx){
        tx.executeSql('select * from notebook WHERE isSync=? order by sort desc', [0], function(tx, data){
            var temp;
            for (var i=0; i<data.rows.length; i++) {
                temp = data.rows.item(i);
                $.when(noteUpdateOne(temp['id'], temp['content'], temp['title'], temp['updateTime'], temp['sort'])).done(function(data){
                    if(data.errorCode > 0) {
                        if (data.errorCode ==2) {
                            resetSesssionId(function(){
                                checkUpdateAll(function(){}, function(){});
                            });
                        }
                        error(data.errorCode);
                    } else {
                        var d = data.result;
                        db.transaction(function(tx){
                            tx.executeSql("UPDATE notebook SET updateTime=?, isSync=? WHERE id=?", [d.updateTime, 1, d.id], function(tx, data){
                                fn();
                            }, null);
                        });
                    }
                });
            }
        }, function(tx, error) {
            error(10000);
        });
    });
};

/* 重设sesssionId */
var resetSesssionId = function(fn){
    $.when(userGetSessionId(localStorage.username, localStorage.password)).done(function(data){
        if(data.errorCode == "0") {
            localStorage.sessionId = data.result.sessionId;
            localStorage.isVip = data.result.isVip;
            localStorage.isLogin = 'true';
            fn();
        } else {
            return false;
        }
    });
}

/* 创建右键 */
var updateAllContextMenu = function() {
	chrome.contextMenus.removeAll(function(){
		createContextmenu();
	});
};
var createContextmenu = function(){
	if (localStorage.isLogin == 'true' || localStorage.username == '游客') {
		var gMenuItemIds = [];
        var aid = chrome.contextMenus.create({
            "title": chrome.i18n.getMessage('add_on_content'),
            "contexts": ['selection'],
        });
		var bid = chrome.contextMenus.create({
            "type": "normal",
			"title": chrome.i18n.getMessage('add_on_content_new'),
			"contexts": ['selection'],
            "parentId": aid,
            "onclick": function (info, tab) {
                var content = info.selectionText;
                var title = '未命名标题_';
                console.log(content)
                console.log(title)
                $.when(noteAddOne(content, title)).done(function(data){
                    if(data.errorCode >0) {
                    } else {
                        title = '未命名标题_'+data.result.id;
                        db.transaction(function(tx) {
                            tx.executeSql("DELETE from notebook WHERE id=?", [data.result.id], null, null);
                            tx.executeSql("INSERT INTO notebook (id, title, content, updateTime, sort, isSync) values(?, ?, ?, ?, ?, ?)",
                                [data.result.id, title, content, data.result.updateTime, 0, 1], null, null);
                            localStorage.select = data.result.id;
                        });
                        /* update ContextMenu*/
                        updateAllContextMenu();
                    }
                });
            }
		});
        var cid = chrome.contextMenus.create({
            "type": "normal",
            "title": chrome.i18n.getMessage('add_on_content_append'),
            "contexts": ['selection'],
            "parentId": aid
        });
        db.transaction(function(tx){
            tx.executeSql('select * from notebook order by sort desc', [], function(tx, data){
                var temp;
                for (var i=0; i<data.rows.length; i++) {
                    temp = data.rows.item(i);
                    var e = chrome.contextMenus.create({
                        "type": "normal",
                        "title": temp['title'],
                        "contexts": ['selection'],
                        "parentId": cid,
                        "onclick": function(info, tab){
                            for (var j = 0; j < gMenuItemIds.length; j++) {
                                if (gMenuItemIds[j].menuId == info.menuItemId) {
                                    var noteId = gMenuItemIds[j].notei;
                                    db.transaction(function(tx){
                                        tx.executeSql("select * from notebook where id='"+noteId+"'", [], function(tx, data){
                                            var temp = data.rows.item(0);
                                            var content = temp['content'] + '<div>' + info.selectionText + '</div>';
                                            tx.executeSql("UPDATE notebook SET content=?, isSync=? WHERE id=?",
                                                    [content, 0, noteId], null, null);
                                            localStorage.lastUpdateTime = (new Date()).getTime();
                                        }, null);
                                    });
                                }
                            }
                        }
                    });
                    gMenuItemIds.push({
                        "menuId": e,
                        "notei": temp['id']
                    });

                }
            }, function(tx, error) {
                error(10000);
            });
        });
	}
};

/* 监控popup是否关闭 */
var popupIsOpen = false;
var lastOpenTime = (new Date).getTime();
var popupOpen = function(){
    popupIsOpen = true;
    lastOpenTime = (new Date).getTime();
    //console.log('popupOpen');
};

$(function(){
    /* 如果是第一次使用，初始化localStorage */
    if(localStorage.isFirst != 'false') {
        initLocalStorage();
    } else if(localStorage.isLogin == 'false') {
        initLocalStorage();
    } else {
        checkUpdateAll(function(){}, function(){});
    }
    updateAllContextMenu();
    var interval = setInterval(function(){
        if (localStorage.isLogin == 'true' && popupIsOpen && ((new Date).getTime() - lastOpenTime) > 3000) {
            noteUpdateAll(function(){}, function(){});
            popupIsOpen = false;
            //console.log('popupOpen set false');
        }
    }, 5000);
});
