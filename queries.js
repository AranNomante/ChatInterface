//mail queries postgresql
//get
const getMailUsers="SELECT chat_user_id,last_login,user_name FROM mail_user WHERE user_id NOT IN ($1)";
const getMailUser="SELECT chat_user_id,last_login,user_name FROM mail_user WHERE user_id = $1";
const getMails="SELECT m.*,get_user_fullname(get_user_id(m.sender)) as sender_fname,get_user_last_login(m.sender) as sender_last_login," +
    "get_user_fullname(get_user_id(m.recipient)) as recipient_fname, get_user_last_login(m.recipient) as recipient_last_login FROM mail m WHERE sender = $1 or m.recipient = $1";
const getMessages="SELECT * FROM message WHERE chat_id = $1 order by sent_on ASC";
//set
const createMail="INSERT INTO mail(sender,recipient,subject,status) VALUES ($1,$2,$3,$4)";
const setMailStatus="UPDATE mail SET status=$1 WHERE chat_id=$2";
const createMessage="INSERT INTO message(chat_id,author,body) VALUES($1,$2,$3)";
const setSeenMsg ="update message set seen='1' where chat_id=$1";
const setSeenMail="update mail set status='Still' where chat_id=$1";
//mail queries