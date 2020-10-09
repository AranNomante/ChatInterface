const chat_module = JSON.parse(document.currentScript.getAttribute('data-module'));
const mode = document.currentScript.getAttribute('data-chatPage');
if (chat_module && !chat_module.mailError) {
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

    function get_unseen_messages() {
        const filtered_messages = [];
        activeChatMessages.forEach(msg => {
            if (msg.seen === '0' && !(msg.author === get_user().chat_user_id)) {
                filtered_messages.push(msg);
            }
        })
        return filtered_messages;
    }

//public:returns all messages return::[]
    function get_messages() {
        return activeChatMessages;
    }

    async function send_mail(recipient) {
        change = true;
        if (allow_change) {
            //xmlhttp;
            const form = formBuilder('sendMail', recipient);
            const ret = await handleRequest(form);
            if (ret === 'request failed') {
                setTimeout(send_mail, 1000, body);
                return false;
            }
            change = false;
            return ret;
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
                    activeChatObj = mails[i];
                    await refreshMessages();
                    success = true;
                    break;
                }
            }
            //load_chat_header('chat_header');
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
                    //console.log(e);
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

//private:refreshes mails
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

//private:refreshes active chat
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
        allow_change = false;
        await refreshMails();
        await refreshMessages();
        load_mails('mail_tab');
        //load_chat_header('chat_header');
        load_chat_messages('messages');
        allow_change = true;
        await update_chat();
    }

    async function update_chat() {
        if (!change) {
            allow_change = false;
            await refreshMails();
            await refreshMessages();
            await check_updates();
            set_updates();
            load_mails('mail_tab');
            update_chat_messages('messages');
        }
        //debug_print(get_messages());
        //console.log(JSON.stringify(mails, null, 2));
        //console.log(JSON.stringify(activeChatMessages, null, 2));
        allow_change = true;
        setTimeout(init_chat, 5000);
    }

//increment update_count on change todo
    function check_updates() {
        update_count = 0;
        let usr_id = get_user().chat_user_id;
        mails.forEach(mail => {
            update_count += (usr_id === mail.recipient && mail.seen_recipient === '0') ? 1 :
                (usr_id === mail.sender && mail.seen_sender === '0') ? 1 : 0;
        })
    }

//refreshes and checks if there are updates
    async function init_updates() {
        await refreshMails();
        await check_updates();
        set_updates();
        setTimeout(init_updates, 10000);
    }

    if (mode === 'chat') {
        init_chat();
    } else {
        init_updates();
    }


//project specific scripts
    function set_updates() {
        const update_count = get_update_count();
        $('#msg_notification').text((update_count > 9) ? '9+' : '' + update_count);
    }

    function load_mails(elem) {
        if (mails.length > 0) {
            //console.log('Chat visual refresh');
            $(`#${elem}`).empty();
            get_mails().forEach((mail, i) => {
                let tab = tab_builder(mail, (mail.chat_id === activeChat))
                $(`#${elem}`).append(tab);
            })
        }
    }

    function load_chat_header(elem) {
        if (activeChatObj) {
            //console.log(activeChatObj)
            //console.log('Chat header visual refresh');
            $(`#${elem}`).empty();
            $(`#${elem}`).append(chat_header_builder());
        }
    }

    function load_chat_messages(elem) {
        if (activeChatMessages.length > 0) {
            //console.log('Chat visual refresh');
            $(`#${elem}`).empty();
            get_messages().forEach(message => {
                $(`#${elem}`).append(chat_message_builder(message));
            })
            //$(`#${elem}`).append(`<div id="msg_scroll" class="mCustomScrollbar"></div>`);
        }
    }

    function update_chat_messages(elem) {
        if (activeChatMessages.length > 0) {
            //console.log('Chat visual update');
            get_unseen_messages().forEach(message => {
                $(`#${elem}`).append(chat_message_builder(message));
            })
        }
    }

    function chat_message_builder(message) {
        if (!(message.author === get_user().chat_user_id)) {
            const msg =
                `
                <div class="incoming_msg">
                    <div class="incoming_msg_img"> 
                        <img src="../public/images/left-imgs/img-1.jpg" alt=""> 
                    </div>
                    <div class="received_msg">
                        <div class="received_withd_msg">
                            <p>${message.body}</p>
                            <span class="time_date">${new Date(message.sent_on).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                `
            return msg;
        } else {
            const msg =
                `
                    <div class="outgoing_msg">
                        <div class="sent_msg">
                            <p>${message.body}</p>
                            <span class="time_date">${new Date(message.sent_on).toLocaleString()}</span>
                        </div>
                    </div>
                    `
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
        let usr_id = get_user().chat_user_id;
        let title;
        let llogin;
        let newmsg = (usr_id === mail.recipient && mail.seen_recipient === '0') ? true :
            (usr_id === mail.sender && mail.seen_sender === '0');
        if (get_user().chat_user_id === mail.recipient) {
            title = mail.sender_fname;
            llogin = new Date(mail.sender_last_login);
        } else {
            title = mail.recipient_fname;
            llogin = new Date(mail.recipient_last_login);
        }
        const tab = `
                <div class="chat_list ${(active) ? 'active_chat' : ''}" id="chat_${mail.chat_id}" data-sender="${mail.sender}">
                     <div class="chat_people">
                        <div class="chat_img"> <img src="../public/images/left-imgs/img-1.jpg" alt=""> </div>
                            <div class="chat_ib">
                                <h5>${title}<span class="chat_date">${llogin.toLocaleString()}</span></h5>
                                <p>${(newmsg) ? '<b>' : ''}${mail.subject}${(newmsg) ? '</b>' : ''}</p>
                            </div>
                        </div>
                     </div>
                </div>`
        return tab;
    }

    $(document).on('click', '.chat_list', async function () {
        $(this).parent().children().removeClass('active_chat');
        $(this).addClass('active_chat');
        const success = await switch_chat(Number(this.id.substring(5, this.id.length)));
        if (!success) {
            //alert('Slow down while switching chats!');
            //console.log('chatswitch success', success);
        }
    })
    let pending_msg = false;
    $(document).on('click', '#send_msg', async function () {
        if (!pending_msg) {
            pending_msg = true;
            const body = $('#message_body').val();
            if (body.length > 0 && body.length < 301) {
                const success = await send_message(body);
                if (!success) {
                    alert('Your message may not has been sent, try refreshing the page.');
                    //console.log('sendmsgsuccess', success);
                }
                //fixed sending messages while a chat is not selected
                if (!(activeChat === -1)) {
                    $('#messages').append(chat_message_builder({
                        author: get_user().chat_user_id,
                        body: body,
                        sent_on: new Date().toJSON()
                    }));
                }
                $('#message_body').val('');
            } else {
                alert('Check message length');
            }
            pending_msg = false;
        }
    })

    let pending_mail = false;
    $(document).on('click', '#submit_mail', function () {
        if (!pending_mail) {
            pending_mail=true;
            processNewMail();
        }
    })

    function processNewMail() {
        change = true;
        if (allow_change) {
            const recipient = $('#mail_usr').val();
            const msg = $('#mail_msg').val();
            if (recipient.length > 0 && msg.length > 0) {
                const chat_id = Number(recipient.split('#')[1]);
                if (chat_id && !(chat_id === get_user().chat_user_id)) {
                    mails.forEach(mail => {
                        if (mail.recipient === chat_id || mail.sender === chat_id) {
                            return;
                        }
                    })
                    createChatandSendMsg(Number(chat_id), msg).then(result => {
                        if (result) {
                            refreshMails().then(() => {
                                $('#close_mail').click();
                                load_mails('mail_tab');
                                $(`#chat_${result}`).click();
                                change = false;
                            });
                        }
                        pending_mail=false;
                    })
                }
            }
        } else {
            setTimeout(processNewMail, 1000);
        }
    }

    async function createChatandSendMsg(chat_id, msg) {
        return new Promise(resolve => {

            send_mail(chat_id).then(ret => {
                //console.log("ret", ret);
                if (ret) {
                    send_message(msg, ret).then(success => {
                        if (success) {
                            resolve(ret)
                        } else {
                            resolve(false);
                        }
                    })
                }
            })

        })
    }

    $(document).keyup(function (event) {
        if (event.key === 'Enter') {
            if ($('#createmail').hasClass('show')) {
                $('#submit_mail').click();
            } else {
                $('#send_msg').click();
            }
        }
    })

}