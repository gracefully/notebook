// 提示消息
var promptingMessage = {
    addHtml:'<div class="prompting text-center"></div>',
    show:function(type, message, second) {
        var ajaxMessageDiv = $('.prompting');
        if(!ajaxMessageDiv.attr('class')) {
            $("body").append(this.addHtml);
            ajaxMessageDiv = $('.prompting');
        }
        var glyphicon = 'glyphicon-ok-refresh';
        if(type == 'success') {
            glyphicon = 'glyphicon-ok-sign';
        } else if(type == 'danger') {
            glyphicon = 'glyphicon-remove-sign';
        } else if(type == 'info') {
            glyphicon = 'glyphicon-refresh';
        }
        var html = '<span class="alert alert-'+type+' alert-dismissible"><span class="glyphicon '+glyphicon+'"></span> '+message+'<button type="button" class="close" data-dismiss="alert" aria-label="Close" ><span aria-hidden="true">&times;</span></button></span>';
        ajaxMessageDiv.html('');
        ajaxMessageDiv.html(html).show();
        if(second > 0) {
            setTimeout(this.hide, second * 1000);
        }
    },
    hide:function() {
        var ajaxMessageDiv = $('.prompting');
        ajaxMessageDiv.html('');
        ajaxMessageDiv.hide();
    }
}

// 显示内容区域
function showContainer(name) {
    if (name == 'body') {
        $('#notepad-login').hide();
        $('#notepad-register').hide();
        $('.footer-fix').hide();
        $('.nav-nologin').hide();
        $('.nav-login').show();
        $('#notepad-body').show();
        if(localStorage.username='游客') {
            $('.nav-nologin').show();
            $('.nav-login').show();
            $(".nav-login-in").hide()
        }
        localStorage.lastSection = name;
    } else {
        $('.nav-login').hide();
        $('.nav-nologin').show();
        $('.footer-fix').show();
        if (name == 'login') {
            $('#notepad-body').hide();
            $('#notepad-register').hide();
            $('#notepad-login').show();
            localStorage.lastSection = name;
        } else if(name == 'register') {
            $('#notepad-body').hide();
            $('#notepad-login').hide();
            $('#notepad-register').show();
            localStorage.lastSection = name;
        }
    }
}
$(function(){
    var background = chrome.extension.getBackgroundPage();
    /* popup打开时通知后端 为了解决关闭时的操作 */
    var interval = setInterval(function(){
        background.popupOpen('background');
    }, 2000);
    /* 用户免登陆登陆操作 */
    $("#FreeLoginBtn").click(function(){
        $('#usernameSpan').html('游客');
        localStorage.username = '游客';
        localStorage.password = '';
        localStorage.sessionId = '';
        localStorage.isVip = 0;
        localStorage.isLogin = 'false';
        promptingMessage.show('success', chrome.i18n.getMessage('success_login'), 2);
        showContainer('body');
        // 接下来要获取分类列表
        getAllNote();
    });
    /* popup打开时默认窗口 */
    if(localStorage.lastSection == 'login' || localStorage.lastSection == 'body' || localStorage.lastSection == 'register') {
        if(localStorage.username == '游客') {
            $("#FreeLoginBtn").trigger("click");
        }else{
            showContainer(localStorage.lastSection);
            if(localStorage.username) {
                $('#loginAccount').val(localStorage.username);
            }
        }
    }
    /* 如果用户是登陆状态下显示左上角用户名 */
    if(localStorage.isLogin == 'true') {
        $('#usernameSpan').html(localStorage.username);
        // 同步内容到服务器
        promptingMessage.show('info', chrome.i18n.getMessage('synchronizing_content'), 0);
        // 同步内容到本地
        background.checkUpdateAll(function(){
            promptingMessage.hide();
            showList();
        }, function(errorCode){
            if(errorCode == 2) {
                promptingMessage.show('info', chrome.i18n.getMessage('synchronizing_content'), 2);
            } else {
                promptingMessage.show('danger', chrome.i18n.getMessage('fail_fetch_content'), 3);
            }
        });
        showList();
        $.when(noticeGet()).done(function(data){
            console.log(data);
            if(data.errorCode == "0") {
                $('#notepad-notice').show().html(data.result);
            }
        });
    }

    // 编辑器处理
    $('a[title]').tooltip({container:'body'});
    $('.dropdown-menu input').click(function() {return false;})
        .change(function () {$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');})
        .keydown('esc', function () {this.value='';$(this).change();});
    $('#editor').wysiwyg();
    // 语言设置
    $('span[lang]').each(function(){
        var lang = $(this).attr('lang');
        $(this).html(chrome.i18n.getMessage(lang));
    });
    $('label[lang]').each(function(){
        var lang = $(this).attr('lang');
        $(this).html(chrome.i18n.getMessage(lang));
    });
    $('input[lang]').each(function(){
        var lang = $(this).attr('lang');
        $(this).attr('placeholder', chrome.i18n.getMessage(lang));
    });

    /* 登陆、注册Tab切换 */
    $('#loginTabLink').click(function(){
        showContainer('login');
        localStorage.lastSection = 'login';
    });
    $('#registerTabLink').click(function(){
        showContainer('register');
        localStorage.lastSection = 'register';
    });

    /* 点击popoutLink 弹出窗口操作 */
    $("#popoutLink").click(function(){
        window.open(location.href, "popup", "width="+$(document).width()+",height="+$(document).height());
        return false;
    });
    /* 点击aboutLink 关于我们 */
    $(".aboutLink").click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'chrome/notebook/index?u=' + localStorage.username});
        return false;
    });
    /* 点击aboutUseLink 使用说明 */
    $("#aboutUseLink").click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'chrome/notebook/index?u=' + localStorage.username});
        return false;
    });
    /* 点击donateLink 捐助 */
    $("#donateLink").click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'donate/index?u=' + localStorage.username});
        return false;
    });
    /* 忘记密码 */
    $('#forgetPwLink').click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'user/guest/forget'});
        return false;
    });
    /* 点击changePasswordLink 修改密码操作 */
    $("#changePasswordLink").click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'user/default/password?sid=' + localStorage.sessionId});
        return false;
    });
    /* 点击noteHistoryLink 历史记录 */
    $('#noteHistoryLink').click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'user/note/history?sid=' + localStorage.sessionId + '&id=' + localStorage.select});
        return false;
    });
    /* 点击exportToTxt 导出操作 */
    $("#exportToTxtLink").click(function(){
        chrome.tabs.create({url:baseRequestUrl + 'user/note/export?sid=' + localStorage.sessionId});
        return false;
    });

    /* 登陆按钮焦点 */
    $("#loginPassword").keyup(function(event){
        if(event.keyCode==13){
            $("#loginBtn").click();
        }
    });

    /* 用户登陆操作 */
    $("#loginBtn").click(function(){
        promptingMessage.show('info', chrome.i18n.getMessage('logining'), 0);
        var username = $("#loginAccount").val();
        var password = $("#loginPassword").val();
        if(!username || !password) {
            promptingMessage.show('danger', chrome.i18n.getMessage('username_or_password_is_empty'), 1);
            return false;
        }
        password = hex_md5(password);
        $.when(userGetSessionId(username, password)).done(function(data){
            if(data.errorCode == "0") {
                $('#usernameSpan').html(username);
                localStorage.username = username;
                localStorage.password = password;
                localStorage.sessionId = data.result.sessionId;
                localStorage.isVip = data.result.isVip;
                localStorage.isLogin = 'true';
                $("#loginPassword").val('');
                promptingMessage.show('success', chrome.i18n.getMessage('success_login'), 2);
                showContainer('body');
                // 接下来要获取分类列表
                getAllNote();
            } else {
                promptingMessage.show('danger', data.errorMessage, 2);
                return false;
            }
        });
    });
    /* 点击registerBtn 注册操作 */
    $("#registerBtn").click(function(){
        promptingMessage.show('info', chrome.i18n.getMessage('registering'), 0);
        var username = $("#registerUsername").val();
        var email = $("#registerEmail").val();
        var password = $("#registerPassword").val();
        var mobile = $("#registerMobile").val();
        if(!username || username.length<3 || username.length>15) {
            promptingMessage.show('danger', chrome.i18n.getMessage('error_username_format'), 2);
            return ;
        }
        if(!password) {
            promptingMessage.show('danger', chrome.i18n.getMessage('password_is_empty'), 2);
            return ;
        }
        var emailReg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+((\.[a-zA-Z0-9_-]{2,3}){1,2})$/;
        if(!emailReg.test(email)) {
            promptingMessage.show('danger', chrome.i18n.getMessage('error_email_format'), 2);
            return false;
        }
        var mobileReg = /^1[3458]\d{9}$/;
        if(mobile && !mobileReg.test(mobile)) {
            promptingMessage.show('danger', chrome.i18n.getMessage('error_mobile_format'), 2);
            return false;
        }
        password = hex_md5(password);
        $.when(userRegister(username, password, email, mobile)).done(function(data){
            if(data.errorCode == "0") {
                localStorage.username = username;
                localStorage.password = password;
                localStorage.sessionId = data.result.sessionId;
                localStorage.isLogin = 'true';
                $("#registerPassword").val('');
                promptingMessage.show('success', chrome.i18n.getMessage('success_register'), 2);
                showContainer('body');
                // 接下来要获取分类列表
                getAllNote();
            } else {
                promptingMessage.show('danger', data.errorMessage, 2);
                return false;
            }
        });
    });

    /* 用户退出操作 */
    $('#logoutLink').click(function(){
        // 退出时判断是否有未同步的内容
        db.transaction(function(tx){
            tx.executeSql('select * from notebook WHERE isSync=? order by sort desc', [0], function(tx, data){
                var count = 0;
                for (var i=0; i<data.rows.length; i++) {
                    count++;
                }
                if(count == 0) {
                    showContainer('login');
                    initLocalStorage();
                    promptingMessage.show('success', chrome.i18n.getMessage('success_logout'), 1);
                    updateAllContextMenu();
                } else {
                    promptingMessage.show('info', chrome.i18n.getMessage('content_no_sync'), 0);
                    background.noteUpdateAll(function(){
                        promptingMessage.show('success', chrome.i18n.getMessage('is_sync_allow_logout'), 3);
                        showContent(localStorage.select, function(){});
                    }, function(){});
                }
            }, null);
        });
    });

    // 点击左侧显示右侧内容
    $('.left-menu ul').on('click', 'li', function(){
        var tthis = $(this);
        var noteId = tthis.attr('noteId');
        showContent(noteId, function(){
            $('.left-menu ul li').removeClass('active');
            tthis.addClass('active');
        });
    });

    /* 增加操作 */
    $('#noteAddLink').click(function(){
        promptingMessage.show('info', chrome.i18n.getMessage('adding'), 0);
        var d = new Date();
        var title = (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
        var content = '';
        $.when(noteAddOne(content, title)).done(function(data){
            if(data.errorCode >0) {
                promptingMessage.show('danger', chrome.i18n.getMessage('fail_add_content'), 3);
            } else {
                db.transaction(function(tx) {
                    tx.executeSql("DELETE from notebook WHERE id=?", [data.result.id], null, null);
                    tx.executeSql("INSERT INTO notebook (id, title, content, updateTime, sort, isSync) values(?, ?, ?, ?, ?, ?)",
                            [data.result.id, title, content, data.result.updateTime, 0, 1], null, null);
                    localStorage.select = data.result.id;
                    showList();
                });
                promptingMessage.hide();
                /* update ContextMenu*/
                updateAllContextMenu();
            }
        });
    });

    /* 删除操作 */
    $('#noteDelBtn').click(function(){
        var noteId = localStorage.select;
        $.when(noteDeleteOne(noteId)).done(function(data) {
            if(data.errorCode >0) {
                promptingMessage.show('danger', chrome.i18n.getMessage('fail_delete'), 3);
            } else {
                db.transaction(function(tx) {
                    tx.executeSql("DELETE from notebook WHERE id='"+noteId+"'", [], null, null);
                    tx.executeSql("select * from notebook order by sort desc limit 1", [], function(tx, data){
                        var temp;
                        for (var i=0; i<data.rows.length; i++) {
                            temp = data.rows.item(i);
                            localStorage.select = temp['id'];
                            showList();
                        }
                    }, null);
                });
                promptingMessage.hide();
                /* update ContextMenu*/
                updateAllContextMenu();
            }
        });
    });

    /* 同步操作 */
    $('#noteSyncLink').click(function(){
        promptingMessage.show('info', chrome.i18n.getMessage('synchronizing_content'), 0);
        // 同步内容到服务器
        background.noteUpdateAll(function(){
            showContent(localStorage.select, function(){
                promptingMessage.show('success', chrome.i18n.getMessage('success_sync_content'), 2);
            });
        }, function(){
            promptingMessage.show('danger', chrome.i18n.getMessage('fail_fetch_content'), 3);
        });
        // 同步内容到本地
        background.checkUpdateAll(function(){
            showContent(localStorage.select, function(){
                promptingMessage.show('success', chrome.i18n.getMessage('success_sync_content'), 2);
            });
        }, function(errorCode){
            promptingMessage.show('danger', chrome.i18n.getMessage('fail_fetch_content'), 3);
        });
    });

    /* 内容改变时进行处理 */
    $('#noteTitle').blur(saveChange).keyup(saveChange);
    $('#noteSort').blur(saveChange).keyup(saveChange);
    $('#editor').blur(saveChange).keyup(saveChange);
});

function saveChange() {
    var noteId = localStorage.select;
    var title = $('#noteTitle').val();
    var sort = $('#noteSort').val();
    var content = $('#editor').html();
    db.transaction(function(tx){
        tx.executeSql("select * from notebook where id='"+noteId+"'", [], function(tx, data){
            if (data.rows.length > 0) {
                var temp = data.rows.item(0);
                var isEdit = false;
                var isTitleEdit = false;
                if (title != temp['title']) {
                    isEdit = true
                    isTitleEdit = true;
                }
                if (sort != temp['sort']) {
                    isEdit = true
                }
                if (content != temp['content']) {
                    isEdit = true
                }
                if (isEdit) {
                    tx.executeSql("UPDATE notebook SET title=?, content=?, sort=?, isSync=? WHERE id=?",
                        [title, content, sort, 0, noteId], null, null);
                    $('#noteUpdateTime').removeClass('label-success').addClass('label-danger');
                    if(isTitleEdit) {
                        $('.left-menu ul li[noteId='+noteId+'] a').html(title);
                    }
                    localStorage.lastUpdateTime = (new Date()).getTime();
                }
            }
        }, function(tx, error) {
            promptingMessage.show('danger', chrome.i18n.getMessage('error_login_again'), 0);
        });
    });
}

/* 获取所有记事本内容 */
function getAllNote() {
    promptingMessage.show('info', chrome.i18n.getMessage('content_fetching'), 0);
    $.when(noteGetList()).done(function(data){
        if(data.errorCode > 0) {
            promptingMessage.show('danger', chrome.i18n.getMessage('fail_fetch_content'), 3);
        } else {
            var d = {};
            if(localStorage.isLogin == 'false') {
                    showList();
                    promptingMessage.show('success', chrome.i18n.getMessage('success_fetch_content'), 2);
            }else{
                db.transaction(function(tx) {
                    for (var i=0; i<data.result.length; i++) {
                        d = data.result[i];
                        tx.executeSql("DELETE from notebook WHERE id=?", [d.id], null, null);
                        tx.executeSql("INSERT INTO notebook (id, title, content, updateTime, sort, isSync) values(?, ?, ?, ?, ?, ?)",
                            [d.id, d.title, d.content, d.updateTime, d.sort, 1], null, null);
                        localStorage.select = d.id;
                    }
                    showList();
                    promptingMessage.show('success', chrome.i18n.getMessage('success_fetch_content'), 2);
                });
            }
        }
    });
}

/* 显示 列表 */
function showList() {
    promptingMessage.show('info', chrome.i18n.getMessage('content_showing'), 0);
    db.transaction(function(tx){
        tx.executeSql("select * from notebook order by sort desc", [], function(tx, data){
            var temp;
            var html = '';
            for (var i=0; i<data.rows.length; i++) {
                temp = data.rows.item(i);
                if(localStorage.select == temp['id']) {
                    html += '<li noteId="'+temp['id']+'" class="active"><a href="#">'+temp['title']+'</a></li>';
                } else {
                    html += '<li noteId="'+temp['id']+'"><a href="#">'+temp['title']+'</a></li>';
                }
            }
            $('.left-menu ul').html(html);
            showContent(localStorage.select, function(){});
            promptingMessage.hide();
        }, function(tx, error) {
            promptingMessage.show('danger', chrome.i18n.getMessage('error_login_again'), 0);
        });
    });
}

/* 显示 内容 */
function showContent(noteId, fn) {
    db.transaction(function(tx){
        tx.executeSql("select * from notebook where id='"+noteId+"'", [], function(tx, data){
            if (data.rows.length > 0) {
                localStorage.select = noteId;
                var temp = data.rows.item(0);
                $('#noteTitle').val(temp['title']);
                $('#editor').html(temp['content']);
                if (temp['isSync'] == 1) {
                    $('#noteUpdateTime').removeClass('label-danger').addClass('label-success');
                } else {
                    $('#noteUpdateTime').removeClass('label-success').addClass('label-danger');
                }
                $('#noteUpdateTime').html(dateToString(temp['updateTime']));
                $('#noteSort').val(temp['sort']);
                $('.left-menu ul li[noteId='+noteId+'] a').html(temp['title']);
                fn();
            }
        }, function(tx, error) {
            promptingMessage.show('danger', chrome.i18n.getMessage('error_login_again'), 0);
        });
    });
}

/* 时间戳转换到时间 */
function dateToString(time) {
    var newDate = new Date();
    newDate.setTime(time * 1000);
    var string = '';
    string += newDate.getFullYear();
    string += '-' + (newDate.getMonth() + 1);
    string += '-'+newDate.getDate();
    string += ' '+newDate.getHours();
    string += ':'+newDate.getMinutes();
    string += ':'+newDate.getSeconds();
    return string;
}