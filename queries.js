//mail queries postgresql
//get
const getMailUsers="SELECT chat_user_id,last_login,user_name FROM mail_user WHERE user_id NOT IN ($1)";
const getMailUser="SELECT chat_user_id,last_login,user_name FROM mail_user WHERE user_id = $1";
const getMails="SELECT m.*,u.user_name as recipient_fname,u.last_login as recipient_last_login FROM mail m,mail_user u WHERE m.sender = $1 and m.recipient=u.chat_user_id;";
const getMessages="SELECT * FROM message WHERE chat_id = $1 order by sent_on ASC";
//set
const createMail="INSERT INTO mail(sender,recipient,subject,status) VALUES ($1,$2,$3,$4)";
const setMailStatus="UPDATE mail SET status=$1 WHERE chat_id=$2";
const createMessage="INSERT INTO message(chat_id,author,body) VALUES($1,$2,$3)";
const setSeenMsg ="update message set seen='1' where chat_id=$1";
const setSeenMail="update mail set status='Still' where chat_id=$1";
//mail queries