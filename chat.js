const chat_module = JSON.parse(document.currentScript.getAttribute('data-module'));
console.log(JSON.stringify(chat_module, null, 2));
const mode = document.currentScript.getAttribute('data-chatPage');
let mail_user = chat_module.mail_user;
//let mail_users=chat_module.mail_users;
let mails = chat_module.mails;
let activeChat = (mails.length === 0) ? -1 : mails[0].chat_id;
let activeChatObj = (mails.length === 0) ? null : mails[0];
let activeChatMessages = [];//ordered from oldest to latest
let change = false;
let allow_change = false;
let update_count = 0;

function debug_print(elem) {
    console.log('Debug:');
    console.log(JSON.stringify(elem, null, 2));
}

//defaults mail_user:{},mail_users:[],mails:[],messages:[]
function get_update_count() {
    return update_count;
}

//public:returns current user return::{}
function get_user() {
    return mail_user;
}

/*
//returns a specified user except current return::{}
function get_user(user_id) {
    mail_users.forEach(user => {
        if (user.chat_user_id === user_id) {
            return user;
        }
    });
    return {};
}

//returns every user except current
function get_users() {
    return mail_users;
}
*/

//public:returns mails sent to a specific user return::[]
function get_mails(recipient) {
    const filtered_mails = [];
    mails.forEach(mail => {
        if (mail.recipient === recipient) {
            filtered_mails.push(mail)
        }
    });
    return filtered_mails;
}

//public:returns mails with given status return::[]
function get_mails(status) {
    const filtered_mails = [];
    mails.forEach(mail => {
        if (mail.status === status) {
            filtered_mails.push(mail);
        }
    })
    return filtered_mails;
}

//public:returns mails with given status and recipient return::[]
function get_mails(status, recipient) {
    const filtered_mails = [];
    mails.forEach(mail => {
        if (mail.recipient === recipient && mail.status === status) {
            filtered_mails.push(mail);
        }
    })
    return filtered_mails;
}

//public:returns all mails return::[]
function get_mails() {
    return mails;
}

//public:returns last messages from start as many as count return::[]
function get_messages(start = 0, count) {
    const filtered_messages = [];
    if (start < activeChatMessages.length) {
        while (i++ < count && i + start < activeChatMessages.length) {
            filtered_messages.push(activeChatMessages[i]);
        }
    }
    return filtered_messages;
}

//public:returns all messages return::[]
function get_messages() {
    return activeChatMessages;
}

async function send_mail(recipient) {
    change = true;
    if (allow_change) {
        let success = false;
        //xmlhttp;
        const form = formBuilder('sendMail', recipient);
        const ret = await handleRequest(form);
        if (ret === 'request failed') {
            setTimeout(send_mail, 1000, body);
            return success;
        } else {
            success = ret;
        }
        change = false;
        return success;
    } else {
        setTimeout(send_mail, 1000, recipient);
    }
}

//public::sends message return::boolean
async function send_message(body, recipient = activeChat) {
    change = true;
    if (allow_change) {
        let success = false;
        //xmlhttp
        const form = formBuilder('sendMessage', [recipient, body]);
        const ret = await handleRequest(form);
        if (ret === 'request failed') {
            setTimeout(send_message, 1000, body);
            return success;
        } else {
            success = ret;
        }
        change = false;
        return success;
    } else {
        setTimeout(send_message, 1000, body);
    }
}

//public:returns true on successful change return::boolean
async function switch_chat(chat_id) {
    change = true;
    if (allow_change) {
        let success = false;
        for (let i = 0; i < mails.length; i++) {
            if (mails[i].chat_id === chat_id) {
                activeChat = chat_id;
                pending_chat = null;
                activeChatObj = mails[i];
                await refreshMessages();
                success = true;
                break;
            }
        }
        change = false;
        return success;
    } else {
        setTimeout(switch_chat, 1000, chat_id);
    }
}

//private
function emptySelection(array) {
    array.length = 0;
}

//private
function handleRequest(form) {
    return new Promise(resolve => {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            try {
                if (this.readyState === 4 && this.status === 200) {
                    const response = JSON.parse(this.responseText);
                    if (response.success) {
                        if (response.delivery) {
                            resolve(response.delivery);
                        } else {
                            resolve(true);
                        }
                    } else {
                        resolve('request failed');
                    }
                }
            } catch (e) {
                resolve('request failed');
                console.log(e);
            }
        };
        request.onerror = function (e) {
            //console.log(e);
            resolve('request failed');
        }
        request.open("POST", "submit_form");
        request.send(form);
    });
}

//private
function formBuilder(method, arguments = null) {
    const form = new FormData();
    const user = get_user();
    form.append('form_type', 'chat_form');
    form.append('user', user.chat_user_id);
    switch (method) {
        case 'refreshMails':
            form.append('method', 'refreshMails');
            break;
        case 'refreshMessages':
            form.append('method', 'refreshMessages');
            form.append('chat_id', arguments);
            break;
        case 'sendMessage':
            form.append('method', 'sendMessage');
            form.append('chat_id', arguments[0]);
            form.append('body', arguments[1]);
            break;
        case 'sendMail':
            form.append('method', 'sendMail');
            form.append('recipient', arguments);
            break;
    }
    return form;
}

//private:refreshes mails todo
async function refreshMails() {
    //build request
    const form = formBuilder('refreshMails');
    const new_mails = await handleRequest(form);
    if (new_mails === 'request failed') {
        return;
    }
    emptySelection(mails);
    mails = new_mails;
    //set new
}

//private:refreshes active chat todo
async function refreshMessages() {
    //submit xmlhttp req
    const form = formBuilder('refreshMessages', activeChat);
    const new_messages = await handleRequest(form);
    if (new_messages === 'request failed') {
        return;
    }
    emptySelection(activeChatMessages);
    activeChatMessages = new_messages;
    //set new
}

//private
async function init_chat() {
    if (!change) {
        allow_change = false;
        await refreshMails();
        await refreshMessages();
    }
    load_mails('mail_tab');
    load_chat_header('chat_header');
    load_chat_messages('messages');
    //debug_print(get_messages());
    //console.log(JSON.stringify(mails, null, 2));
    //console.log(JSON.stringify(activeChatMessages, null, 2));
    allow_change = true;
    setTimeout(init_chat, 1000);
}


//increment update_count on change
function check_updates() {
    update_count = 0;
    mails.forEach(mail => {
        update_count += (mail.status === 'NewMessage') ? 1 : 0;
    })
}

//refreshes and checks if there are updates
async function init_updates() {
    await refreshMails();
    await check_updates();
    setTimeout(init_updates, 1000);
}

if (mode === 'chat') {
    init_chat();
} else {
    init_updates();
}


//project specific scripts

function load_mails(elem) {
    if (mails.length > 0) {
        console.log('Chat visual refresh');
        $(`#${elem}`).empty();
        get_mails().forEach((mail, i) => {
            let tab = tab_builder(mail, (mail.chat_id === activeChat))
            $(`#${elem}`).append(tab);
        })
    }
}

function load_chat_header(elem) {
    if (activeChatObj) {
        console.log(activeChatObj)
        console.log('Chat header visual refresh');
        $(`#${elem}`).empty();
        $(`#${elem}`).append(chat_header_builder());
    }
}

function load_chat_messages(elem) {
    if (activeChatMessages.length > 0) {
        console.log('Chat visual refresh');
        $(`#${elem}`).empty();
        get_messages().forEach(message => {
            $(`#${elem}`).append(chat_message_builder(message));
        })
        $(`#${elem}`).append(`<div class="mCustomScrollbar">
                                        </div>`);
    }
}

function chat_message_builder(message) {
    if (message.author === get_user().chat_user_id) {
        const msg =
            `<div class="main-message-box ta-right"><div class="message-dt"><div class="message-inner-dt"><p>${message.body}</p></div><!--message-inner-dt end--><span>${new Date(message.sent_on).toLocaleString()}</span></div><!--message-dt end--></div>`
        return msg;
    } else {
        const msg =
            `<div class="main-message-box st3"><div class="message-dt st3"><div class="message-inner-dt"><p>${message.body}</p> </div><!--message-inner-dt end--><span>${new Date(message.sent_on).toLocaleString()}</span></div><!--message-dt end--></div>`
        return msg;
    }
}

function chat_header_builder() {
    let title;
    if (get_user().chat_user_id === activeChatObj.recipient) {
        title = activeChatObj.sender_fname;
    } else {
        title = activeChatObj.recipient_fname;
    }
    const header = `
                                        <div class="user-status">
                                            <div class="user-avatar">
                                                <img src="../public/images/left-imgs/img-1.jpg" alt="">
                                            </div>
                                            <p class="user-status-title"><span class="bold">${title}</span></p>
                                            <!--<p class="user-status-tag online">Online</p>-->
                                            <div class="user-status-time floaty eps_dots eps_dots5 more_dropdown">
                                                <a href="#"><i class="uil uil-ellipsis-h"></i></a>
                                                <div class="dropdown-content">
                                                    <span><i class="uil uil-trash-alt"></i>Delete</span>
                                                    <span><i class="uil uil-ban"></i>Block</span>
                                                    <span><i class="uil uil-windsock"></i>Report</span>
                                                    <span><i class="uil uil-volume-mute"></i>Mute</span>
                                                </div>
                                            </div>
                                        </div>
    `
    return header;
}

function tab_builder(mail, active) {
    let title;
    let llogin;
    if (get_user().chat_user_id === mail.recipient) {
        title = mail.sender_fname;
        llogin = new Date(mail.sender_last_login);
    } else {
        title = mail.recipient_fname;
        llogin = new Date(mail.recipient_last_login);
    }
    const tab = `
                <div class="chat__message__dt ${(active) ? 'active' : ''}" id="chat_${mail.chat_id}" data-sender="${mail.sender}">
                    <div class="user-status">
                         <div class="user-avatar">
                             <img src="../public/images/left-imgs/img-1.jpg" alt="">
                             ${(mail.status === 'NewMessage') ? '<div class="msg__badge">!</div>' : ''}                       
                         </div>
                         <p class="user-status-title"><span class="bold">${title}</span></p>
                         <p class="user-status-text">${mail.subject}</p>
                         <p class="user-status-time floaty">${llogin.toLocaleString()}</p>
                         </div>
                    </div>`
    return tab;
}

$(document).on('click', '.chat__message__dt', async function () {
    $(this).parent().children().removeClass('active');
    $(this).addClass('active');
    pending_chat = Number(this.id.substring(5, this.id.length));
    const success = await switch_chat(pending_chat);
    if (!success) {
        alert('Error while switching chats!');
    }
})
$(document).on('click', '.send_msg', async function () {
    const body = $('#chat-widget-message-text-2').val();
    if (body.length > 0) {
        pending_message = body;
        const success = await send_message(pending_message);
        if (!success) {
            alert('Error while sending message!');
        }
    }
})
$(document).on('click', '#submit_mail', function () {
    const recipient = $('#mail_usr').val();
    const msg = $('#mail_msg').val();
    if (recipient.length > 0 && msg.length > 0) {
        const chat_id = recipient.split('#')[1];
        if (chat_id && chat_id.length > 0) {
            createChatandSendMsg(Number(chat_id), msg)
        }
    }
})

function createChatandSendMsg(chat_id, msg) {
    send_mail(chat_id).then(success => {
        if (success) {
            console.log(success);
            send_message(msg, chat_id).then(success => {
                console.log(success);
            })
        }
    })
}
