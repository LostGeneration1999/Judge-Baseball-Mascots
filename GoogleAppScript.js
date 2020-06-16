var AIMAKER_MODEL_ID = $AIメーカーで作成したモデルのIDを指定してください$;
var AIMAKER_API_KEY = "$AIメーカーのAPIキーを指定してください$";
var LINE_ACCESS_TOKEN = "$LINE Developerで発行されたアクセストークンを指定してください$";
var GOOGLE_DOCS_ID = "$GoogleドキュメントのドキュメントIDを指定してください$";
var doc = DocumentApp.openById(GOOGLE_DOCS_ID);
function doPost(e){
  Logger.log("Post request.");
  try {
    
    var json = JSON.parse(e.postData.contents);
    var token= json.events[0].replyToken;
    //sendLineMessage('判別中...', token);
    var url = 'https://api.line.me/v2/bot/message/'+ json.events[0].message.id +'/content/';
    var image = getImage(url);
    var base64 = Utilities.base64Encode(image.getContent());
    var message = getResult(base64);
    if (message == '') {
      message = "誰やこれ";
    }
    sendLineMessage(message, token);
  } catch (e) {
    Logger.log("ERROR: %s", e)
    message = '画像投稿して・・・';
    sendLineMessage(message, token);
    doc.getBody().appendParagraph(Logger.getLog());
  }
  doc.getBody().appendParagraph(Logger.getLog());
}

function getImage(url){
  return UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'GET'
  });
}

function getResult(base64){
  var result = '';
  var url = 'https://aimaker.io/image/classification/api';
  var payload = {
    "id": AIMAKER_MODEL_ID,
    "apikey": AIMAKER_API_KEY,
    "base64": base64
  };
  var response = UrlFetchApp.fetch(url, {   
    method: 'POST', 
    payload: payload, 
    muteHttpExceptions: true
  });
  response = response.getContentText();
  Logger.log(response); 
  var json = JSON.parse(response);
  var labels = sortLabel(json.labels);
  if (labels[0].label && labels[0].score){ 
    result = 'このマスコットは「' + labels[0].label + '」や！覚えてや！\n';
  }
  return result;
}

function sortLabel(labels){
  labels.sort(function(a,b){
    if (a.score > b.score) return -1;
    if (a.score < b.score) return 1;
    return 0;
  });
  return labels;
}

function sendLineMessage(message,token){
  var url = "https://api.line.me/v2/bot/message/reply";
  return UrlFetchApp.fetch(url, {
    'headers': { 
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
    },
    'method': 'POST',
    'payload': JSON.stringify({ 
      'replyToken': token,
      'messages': [
        { 
          "type": "text",
          "text": message
        } 
      ], 
    })
  });
}
