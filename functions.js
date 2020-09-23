/*
const getMailUsers = async (user_id) => {
    const ret = await query(queries.getMailUsers, [user_id]);//except user
    if (ret.rows.length === 0) {
        return null;//no mail users
    }
    return ret.rows;//[{chat_user_id,last_login},...]
}*/

const getMailUser = async (user_id) => {
    user_id = Number(user_id);
    const ret = await query(queries.getMailUser, [user_id]);
    if (ret.rows.length === 0) {
        return null;//the user is not verified therefore not a mail user
    }
    return ret.rows[0];//chat_user_id,last_login
}
const getMails = async (chat_user_id) => {
    /*
        Mail Statuses:
            NewMessage::user can be notified without loading every message
            Archived::can be seen in archived
            Deleted::still in db but not displayed to user
            Still::no changes
    */
    chat_user_id = Number(chat_user_id);
    const ret = await query(queries.getMails, [chat_user_id]);
    if (ret.rows.length === 0) {
        return null;//the user does not have any mails
    }
    return ret.rows;//[{chat_id,sender,recipient,subject,status,creation_date,last_update,recipient_fname,recipient_last_login},...]
}
const getMessages = async (chat_id) => {
    chat_id = Number(chat_id);
    const ret = await query(queries.getMessages, [chat_id]);
    if (ret.rows.length === 0) {
        return null;//no messages in chat::mail
    }
    await query(queries.setSeenMail,[chat_id]);
    await query(queries.setSeenMsg,[chat_id]);
    return ret.rows;//order by oldest to latest[{message_id,chat_id,author,body,seen,sent_on},...]
}
const createMail = async (credentials) => {
    //credentials::[sender,recipient] sender,recipient::chat_user_id
    const status = "Still";
    const subject = "new";
    await query(queries.createMail, [Number(credentials[0]), Number(credentials[1]), subject, status]);
}
const createMessage = async (credentials) => {
    //credentials::[chat_id,author,body] author::chat_user_id
    await query(queries.createMessage, [Number(credentials[0]), Number(credentials[1]), credentials[2]]);
    await query(queries.setMailStatus, ["NewMessage", Number(credentials[0])]);
}
const chatModule = async (user_id) => {
    const content = {mail_user: {}/*,mail_users:[]*/, mails: []};
    const mail_user = await getMailUser(user_id);
    /*
        if the user is verified
            add user to content
            if there are other mail users
                add users to content
            if there are mails regarding the user
                add mails to content
        else
            add mailError to content
    */
    if (mail_user) {
        content.mail_user = mail_user;
        //const mail_users = await getMailUsers(user_id);
        /*if (mail_users) {
            content.mail_users = mail_users;
        }*/
        const mails = await getMails(mail_user.chat_user_id);
        if (mails) {
            content.mails = mails;
        }
    } else {
        content.mailError = 'not verified';
    }
    return content;
}
const chat_processor = async (form) => {
    let ret;

    switch (form.method) {
        case "refreshMails":
            ret = await getMails(form.user);
            return ret;
        case "refreshMessages":
            ret = await getMessages(form.chat_id);
            return ret;
        case "sendMessage":
            await createMessage([form.chat_id, form.user, form.body]);
            return true;
        case "sendMail":
            await createMail([form.user, form.recipient]);
            return true;
    }
    return null;
}