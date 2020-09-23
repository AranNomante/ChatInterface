const express = require('express');
const router = express.Router();
const functions = require('../functions');
const formidable = require('formidable');

router.post('/', async function (req, res, next) {
    if (!req.session.user_id) {
        res.status(401).json({success: false});
        return;
    }
    req.setTimeout(600000);
    req.keepAliveTimeout = 600000;
    const form = formidable(/*{ multiples: true }*/);
    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            res.status(413).json({success: false});
            res.end();
            return;
        }
        //const ret="call your form handler function here";
        if (fields && fields.form_type === 'chat_form') {
            if (ret) {
                if (ret === true) {
                    res.status(200).json({success: true});
                } else {
                    res.status(200).json({success: true, delivery: ret});
                }
            } else {
                res.status(503).json({succes: false});
            }
        }else {
            res.status(200).json({success: true});
        }
        res.end();
    });
});


module.exports = router;
