$(function () {
    var notifications_enabled = false;
    // Declare a proxy to reference the hub.
    var chat = $.connection.chatHub;

    var lastUserToPost;
    var lastCompNameToPost;

    // Create a function that the hub can call to broadcast messages.
    //ASYNC:
    chat.client.broadcastMessage = function (name, message, color, compName) {
        // Html encode display name and message.
        var encodedName = name;
        var encodedMsg = message;

        var style = 'color: ' + color + ';';

        
            $('#discussion').append('<div class="msg"><div class="sender_name"><strong style="' + style + '">' + encodedName
                + '</strong>:&nbsp;&nbsp;</div><div class="msg_body">' + encodedMsg + '</div></div>');
        

        lastUserToPost = name.split('<')[0];
        lastCompNameToPost = compName;

        var $discussionBoard = $('#discussion-board')[0];
        $discussionBoard.scrollTop = $discussionBoard.scrollHeight;

        botReceivedMessage(name, encodedMsg);

        showNewMessageNotification();
    };


    $.connection.hub.start().done(function () {
        Setup();
        Main();
    });

    function hashCode(str) { // java String#hashCode
        str = str.replace("$", "money");

        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    }

    function intToRGB(i) {
        var c = (i & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();

        return "00000".substring(0, 6 - c.length) + c;
    }

    function DetermineLuma(rgb) {
        //var c = hex.substring(1);      // strip #
        //var rgb = parseInt(c, 16);   // convert rrggbb to decimal
        let colorsOnly = rgb.substring(rgb.indexOf('(') + 1, rgb.lastIndexOf(')')).split(/,\s*/),
        r = colorsOnly[0],
        g = colorsOnly[1],
        b = colorsOnly[2],
        opacity = colorsOnly[3];
        //var r = (rgb >> 16) & 0xff;  // extract red
        //var g = (rgb >> 8) & 0xff;  // extract green
        //var b = (rgb >> 0) & 0xff;  // extract blue

        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

        return luma;
    }

    function Setup() {
        let username;
        let color;
        let storageA = storageAvailable('localStorage');

        if (storageA) {
            username = localStorage.getItem("SIGRLOUNGE_username");
            console.log(username);
            color = localStorage.getItem("SIGRLOUNGE_color");
        }

        username = username || prompt('Enter your name:', '');
        color = color || '#' + intToRGB(hashCode(username));
        console.log(color);



        $('#message').focus();
        $('#displayname').val(username);
        $('#msg_color').css('background-color', color);

        SaveUsernameAndColor();

        chat.server.registerUser({
            username: username,
            messageColor: color
        });

        //idle control:
        setIdleTimeout(10000);
    }

    function SaveUsernameAndColor()
    {
        let username = $('#displayname').val();
        let color = $('#msg_color').css('background-color');
        let storageA = storageAvailable('localStorage');

        if (storageA) {
            localStorage.setItem("SIGRLOUNGE_username", username);
            localStorage.setItem("SIGRLOUNGE_color", color);
        }
    }

    function updateColor() {

    }

    chat.client.getMemberList = function (returnVal) {
        var list = "";

        console.log(returnVal);
        for (var i = 0; i < returnVal.length; i++) {
            let usr = returnVal[i];
            list += "<span style='color:" + usr.MessageColor + ";'>" + usr.Username + ",&nbsp;</span>";
        }
        $("#memberlist").html(list);
    }

    function Main() {
        GetChatHistory();


        $('#sendmessage').click(SendMessage);
        $('#message').keyup(function (e) {
            var k = e.which;
            if (k == 13 && !event.shiftKey) {
                SendMessage();
            }
        });
    }

    function SendMessage() {
        let username = $('#displayname').val();

        if (username == "" || username == null) {
            return;
        }
        // Call the Send method on the hub.
        //chat.server.sendMessage(username, $('#message').val(), $('#msg_color').css('background-color'));
        chat.server.sendMessage({ name: username, message: $('#message').val(), hexColor: $('#msg_color').css('background-color') });

        var color = $('#msg_color').css('background-color');

        SaveUsernameAndColor();

        chat.server.registerUser({
            username: username,
            messageColor: color
        });

        // Clear text box and reset focus for next comment.
        $('#message').val('').focus();
    }

    function GetChatHistory() {
        chat.server.getChatHistory().done(function (e) {
            let chatHistory = e;
            for (let i = 0; i < chatHistory.length; i++) {
                chat.client.broadcastMessage(chatHistory[i].Name, chatHistory[i].Message, chatHistory[i].HexColor);
            }
        });
    }

    document.onIdle = function () {
        console.log("[user is now considered idle]");
        notifications_enabled = true;
    };

    document.onBack = function () {
        console.log("[user is back to active]");
        notifications_enabled = false;
        removeNotifications();
    };

    window.onfocus = function () {
        document.onBack();
    };

    window.onblur = function () {
        document.onIdle();
    };

    var blinkMessage;
    function showNewMessageNotification() {
        if (!notifications_enabled) {
            if (blinkMessage != null)
                clearTimeout(blinkMessage);
            return;
        }

        if (document.title.includes("!")) {
            removeNotifications();
        }
        else {
            document.title = "( ! ) SigR Lounge";
        }
        blinkMessage = setTimeout(showNewMessageNotification, 500);
    }

    function removeNotifications() {
        document.title = "SigR Lounge";
    }




    /****** Bot Functionality  ********/
    let botName = "Hugh Bot";
    let botColor = "000000";
    function initBot(_botName, _botColor){
        botName = _botName;
        botColor = _botColor;
    }

    function botReceivedMessage(name, message){
        console.log(name);
        var elements = $(name);
        console.log(elements);
        var timeElement = $('.usrname-datetime', elements).html();
        console.log(timeElement);
        if(typeof timeElement!== "undefined" && timeElement !== null && timeElement[0] !== null && typeof timeElement[0] !== "undefined"){
            console.log(timeElement);
            var time = timeElement.substring(1, timeElement.length-1);
            console.log("time: " + time)
    
            SendBotMessage(botName, "Heard: " + message + " from user: " + name, botColor);
        }
    }  

    function SendBotMessage(name, message, color) {
        let username = name
        
        chat.server.sendMessage({ name: username, message: message, hexColor: color });

        chat.server.registerUser({
            username: username,
            messageColor: color
        });

        // Clear text box and reset focus for next comment.
        $('#message').val('').focus();
    }
});